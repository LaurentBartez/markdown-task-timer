import * as vscode from 'vscode';
import * as moment from 'moment';
import TimeEntry from './timeEntry';

const TASK_DONE: string = "x";
const TASK_INWORK: string = " ";
const TASK_IDENT: string = "- [";
const TIMESTAMP_FORMAT: string = "YYYY-MM-DD HH:mm";

class Task {
    _textEditor: vscode.TextEditor;
    _title: any;
    _toggles: any;
    _line: any;
    _range: vscode.Range;
    
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
        return this._toggles.length % 2 == 1 ? true : false;
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
                if(toggleIndex == 0 && toggleCount == 1){
                    //just one toggle is there and thats it
                    startDate = this._toggles[toggleIndex];
                    endDate = null;
                    pushEntry = true;   
                }
                else if (toggleIndex % 2 == 1){
                    //use every second toggle
                    startDate = this._toggles[toggleIndex-1];
                    endDate = this._toggles[toggleIndex];
                    pushEntry = true;    
                }
                else if (toggleIndex == toggleCount-1){
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
        return formattedLine.indexOf(this.taskPrefix(TASK_DONE)) == 0;
    }

    get isStarted(): boolean{
        return this._toggles.length > 0;
    }
    public getTimeStamp(index: number){
        return this._toggles[index];
    }

    public atLine(lineToCheck: number): boolean{
        return (this.getLine == lineToCheck);
    }
    public insertTimeStamp(){
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
            const currentDate = Date.now();
            this._toggles.push(currentDate);
			const formattedDate = (moment(currentDate)).format('YYYY-MM-DD HH:mm');
			activeEditor.edit(editBuilder => {
				editBuilder.insert(this.getRange.end, " [" + formattedDate + "]");
			});
		}
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
                if (!this.isActive)
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

    public toggleStatus(){
        const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
            const start = new vscode.Position(this.getLine,this._line.indexOf("-") + 3);
            const end = new vscode.Position(this.getLine,this._line.indexOf("-") + 4);
            const rgToReplace = new vscode.Range(start,end);
            activeEditor.edit(editBuilder =>{
                if (this.isDone){
                    
                    editBuilder.replace(rgToReplace,TASK_INWORK);
                }
                else
                {
                    editBuilder.replace(rgToReplace,TASK_DONE);
                }
            });
        };
    }
    private taskPrefix(status:string):string{
        return (TASK_IDENT + status +"]");
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
                if (data.length == dateScheme.length) {
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
        formattedTitle = formattedTitle.substring((TASK_IDENT+" ] ").length);
        const idxFirstTag = formattedTitle.indexOf("[");
        if (idxFirstTag > 0){
            formattedTitle = formattedTitle.substring(0,idxFirstTag);
        }
        formattedTitle = formattedTitle.trimEnd(); 
        return (formattedTitle);
    }

    constructor(textEditor: vscode.TextEditor,range: vscode.Range) {
        this._textEditor = textEditor || null;
        this._range = range || null;
        this._line = this._textEditor.document.getText(this._range)|| null;
        this._toggles = Task.timeStamps(this._line.substring(3));
        this._title = this.makeTitle(this._line) || null;
    }
}

export default Task;