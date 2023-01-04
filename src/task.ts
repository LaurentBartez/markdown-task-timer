import * as vscode from 'vscode';
import * as moment from 'moment';
import TimeEntry from './timeEntry';
import { text } from 'stream/consumers';

const TASK_DONE: string = "x";
const TASK_INWORK: string = " ";
const BULLET_IDENT: string ="- ";
const TASK_IDENT: string = BULLET_IDENT + "[";
const TIMESTAMP_FORMAT: string = "YYYY-MM-DD HH:mm";

class Task {
    _document: vscode.TextDocument;
    _title: any;
    _toggles: any;
    _line: any;
    _range: vscode.Range;
    _state: number; //0: text; 1: bullet; 2: in work; 3: done

    get getRange():vscode.Range {
        return this._range;
    }

    get getInfo(): vscode.MarkdownString {
        var info = new vscode.MarkdownString(`**` + this._title + `**  `);
        var statusString:string = "";
        if (this.isDone){
            statusString = `<span style="color:#008000;">Done</span>`;
        }
        info.appendMarkdown(statusString);
        info.appendMarkdown("\n\n---\n\n");

        info.appendMarkdown("\n\nDuration: " + +this.totalDuration.toFixed(2) + "h");
        
        info.supportHtml = true;
        info.isTrusted = true;
        return info;
    }

    get isActive():boolean {
        return this._toggles.length % 2 === 1 ? true : false;
    }

    get getLine():number{
        return this._range.start.line;
    }

    get getTitle():string{
        return this._title;
    }

    get countToggles(): number{
        return this._toggles.length; 
    }
    get getTable():TimeEntry[]{
        var table:TimeEntry[] = [];
        const toggleCount = this.countToggles;
        if (toggleCount> 1)
        {
            for (var toggleIndex = 0; toggleIndex < toggleCount; toggleIndex++)
            {
                var startDate;
                var endDate;
                var dur: number = 0;
                var pushEntry: boolean = false;
                if(toggleIndex === 0 && toggleCount === 1){
                    //just one toggle is there and thats it
                    startDate = this._toggles[toggleIndex];
                    endDate = null;
                    pushEntry = true;   
                }
                else if (toggleIndex % 2 === 1){
                    //use every second toggle
                    startDate = this._toggles[toggleIndex-1];
                    endDate = this._toggles[toggleIndex];
                    pushEntry = true;    
                }
                else if (toggleIndex === toggleCount-1){
                    // thats the last one. task is active
                    startDate = this._toggles[toggleIndex];
                    endDate = null;
                    pushEntry = true;   
                }
                if (pushEntry){
                    const newEntry:TimeEntry = new TimeEntry(startDate,endDate);
                    table.push(newEntry);
                }   
            }
        }

        return table;
    }

    get totalDuration(): number{
        var duration = 0;
        const entries = this.getTable;

        entries.forEach(element => {
            duration = duration + element._durationMs / 1000 / 60 / 60;    
        });

        return duration;
    }
    get infoTable():string{
        var table = this.getTable;
        var formatted:any[] = [];
        table.forEach(element=>{
            formatted.push(element.formatted(TIMESTAMP_FORMAT));
        });
        const tableify = require('html-tableify');
        var tableHTML = tableify(formatted);
        return tableHTML.replaceAll("text-align: center","text-align: center;border: 1px solid black;border-collapse: collapse;");
    }
    get isDone(): boolean{
        const formattedLine = this._line.trimStart();
        return formattedLine.indexOf(this.taskPrefix(3)) === 0;
    }

    get isStarted(): boolean{
        return this._toggles.length > 0;
    }

    get fileName(): string{
        return this._document.fileName;
    }
    public getTimeStamp(index: number){
        return this._toggles[index];
    }

    public atLine(lineToCheck: number): boolean{
        return (this.getLine === lineToCheck);
    }
    public insertTimeStamp(){
            const currentDate = Date.now();
            this._toggles.push(currentDate);
			const formattedDate = (moment(currentDate)).format('YYYY-MM-DD HH:mm');
            var t = this._document.getText(this._range);
            t += " [" + formattedDate + "]";
            const textEdits: vscode.TextEdit[] = [];
            var tEdit = new vscode.TextEdit(this._range, t);
            textEdits.push(tEdit);
            const workEdit = new vscode.WorkspaceEdit();
            workEdit.set(this._document.uri,textEdits);
            vscode.workspace.applyEdit(workEdit);
	}

    ///function to get infotext for a given timestamp
    public timeStampInfo(timeStamp: string){
        const dateToCheck = new Date(timeStamp);

        var indexSelected = this._toggles.length; 
        var foundToggle: boolean = false;
        for (var iDate = 0; iDate < this._toggles.length; iDate++){
			const formattedDate = (moment(this._toggles[iDate])).format('YYYY-MM-DD HH:mm');

            if (formattedDate === timeStamp)
            {
                indexSelected = iDate;
                foundToggle = true;
                break;
            }
        }
        
        var entry;
        const text = new vscode.MarkdownString('');
        if (foundToggle)
        {
            if (indexSelected % 2 === 0
                || indexSelected === 0)
            {
                /// timestamp started a task
                text.appendMarkdown('**' + timeStamp +'** - ');
                if (indexSelected < this._toggles.length -1)
                {
                    const indexAdjacent = indexSelected + 1; 
                    text.appendMarkdown((moment(this._toggles[indexAdjacent])).format('YYYY-MM-DD HH:mm'));    
                    entry = new TimeEntry(new Date(timeStamp),this._toggles[indexAdjacent]);
                }
                else{
                    entry = new TimeEntry(new Date(timeStamp),new Date());

                }
            }
            else
            {
                ///timestamp stopped a task
                const indexAdjacent = indexSelected - 1; 
                text.appendMarkdown((moment(this._toggles[indexAdjacent])).format('YYYY-MM-DD HH:mm')  + ' - **' + timeStamp +'** ');
                entry = new TimeEntry(this._toggles[indexAdjacent],new Date(timeStamp));
            }
            text.appendMarkdown("\n\n---\n\n");
            text.appendMarkdown("\n\nDuration: " + +(entry._durationMs/1000/60/60).toFixed(2) + "h");
        }
        
        return text; 
    }
    public promote() : vscode.TextEdit {
        var newStatus: number;
        if (this._state === 3){
            newStatus = 0;
        }
        else{
            newStatus = this._state + 1;
        }
        const tEdit = this.editStatusText(newStatus);
        this._state = newStatus;
        return tEdit;    
    }

    public demote() : vscode.TextEdit {
        var newStatus: number;
        if (this._state === 0){
            newStatus = 3;
        }
        else{
            newStatus = this._state - 1;
        }
        const tEdit = this.editStatusText(newStatus);
        this._state = newStatus;
        return tEdit;     
    }

    public goToTask(){
        var openPath = vscode.Uri.file(this.fileName);
        vscode.workspace.openTextDocument(openPath).then(doc => {
        vscode.window.showTextDocument(doc).then(editor => {
        editor.selections = [new vscode.Selection(this._range.start, this._range.end)];
        editor.revealRange(new vscode.Range(this._range.start, this._range.end));
      });
    });
}

    public editStatusText(newStatus: number) : vscode.TextEdit {
            var prefix = this.taskPrefix(this._state);
            var start;
            var end;
            
            if (prefix.length === 0)
            {
                const line = this._line;
                const offset = line.length - line.trimStart().length;
                start = new vscode.Position(this.getLine, offset);
                end = new vscode.Position(this.getLine, offset);
            }
            else{
                start = new vscode.Position(this.getLine,this._line.indexOf(prefix));
                end = new vscode.Position(this.getLine,this._line.indexOf(prefix) + prefix.length);
            }
            const rgToReplace = new vscode.Range(start,end);
            const newPrefix = this.taskPrefix(newStatus);
            return new vscode.TextEdit(rgToReplace, newPrefix);
    }
    private taskPrefix(status:number):string{
        var prefix: string = "";
        if (status === 1){
            prefix = BULLET_IDENT;
        }
        else if (status === 2){
            prefix = TASK_IDENT + TASK_INWORK +"] ";
        }
        else if (status === 3){
            prefix = TASK_IDENT + TASK_DONE + "] ";
        }
        return prefix;
    }

    static timeStamps(line: string):Date[] {
        var tagToCheck = "[";
        var startTags = line.indexOf(tagToCheck);
        var content:Date[] = [];
        const dateScheme = TIMESTAMP_FORMAT;
        if (startTags > -1) {
            line = line.substring(startTags);
            var endTask = line.indexOf("]");
            if (endTask > -1){
                var data = line.substring(1,endTask);
                if (data.length === dateScheme.length) {
                    content.push(new Date(data));
                }
                line = line.substring(endTask +1);
                if (line.length > 0){
                    content = content.concat(this.timeStamps(line));
                }
            }
        }
        return content;    
    }

    private makeTitle(line: string): string{
        var formattedTitle:string = line.trimStart();
        formattedTitle = formattedTitle.substring(this.taskPrefix(this._state).length);
        const idxFirstTag = formattedTitle.indexOf("[");
        if (idxFirstTag > 0){
            formattedTitle = formattedTitle.substring(0,idxFirstTag);
        }
        formattedTitle = formattedTitle.trimEnd(); 
        return (formattedTitle);
    }
    private makeState(line: string): number{
        var arrayToCheck =[3,2,1,0];
        var formattedLine = line.trimStart();
        var estimatedState:number = 0; 
        arrayToCheck.every(element => {
            if (formattedLine.startsWith(this.taskPrefix(element))){
                estimatedState = element;
                return false;
            }
            return true;
        });
        return estimatedState;
    }
    constructor(document: vscode.TextDocument,range: vscode.Range) {
        this._document = document || null;
        this._range = range || null;
        this._line = this._document.getText(this._range)|| null;
        this._state = this.makeState(this._line);
        this._title = this.makeTitle(this._line) || null;
        this._toggles = Task.timeStamps(this._line.substring(this.taskPrefix(this._state).length));
    }
}

export default Task;