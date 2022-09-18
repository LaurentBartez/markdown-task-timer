import * as vscode from 'vscode';
import * as moment from 'moment';
import { table } from 'console';

interface timeEntry {
    start: Date;
    end: Date;
    durationMs: number;
  }
const TASK_DONE: string = "x";
const TASK_INWORK: string = " ";
const TASK_IDENT: string = "- [";

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
        var info = new vscode.MarkdownString(`**` + this._title + `**\n\n`);
        info.appendText("Duration: " + this.totalDuration + "h");
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
    get getTable():timeEntry[]{
        var table:timeEntry[] = [];
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
                    dur =  new Date().getTime() - new Date(startDate).getTime();
                    pushEntry = true;   
                }
                else if (toggleIndex % 2 == 1){
                    //use every second toggle
                    startDate = this._toggles[toggleIndex-1];
                    endDate = this._toggles[toggleIndex];
                    dur =  new Date(endDate).getTime() - new Date(startDate).getTime();   
                    pushEntry = true;    
                }
                else if (toggleIndex == toggleCount-1){
                    // thats the last one. task is active
                    startDate = this._toggles[toggleIndex];
                    endDate = null;
                    dur =  new Date().getTime() - new Date(startDate).getTime();
                    pushEntry = true;   
                }
                if (pushEntry){
                    const newEntry:timeEntry = {
                        start: startDate,
                        end: endDate,
                        durationMs: dur 
                    };
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
            duration = duration + element.durationMs / 1000 / 60 / 60;    
        });

        return duration;
    }
    get isDone(): boolean{
        const formattedLine = this._line.trimStart();
        return formattedLine.indexOf(this.taskPrefix(TASK_DONE)) == 0;
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
            })
        };
    }
    private taskPrefix(status:string):string{
        return (TASK_IDENT + status +"]");
    }
    static timeStamps(line: string):Date[] {
        var tagToCheck = "[";
        var startTags = line.indexOf(tagToCheck);
        var content:Date[] = [];
        const dateScheme = "YYYY-MM-DD HH:mm";
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