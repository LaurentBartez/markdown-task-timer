import * as vscode from 'vscode';
import * as moment from 'moment';


class Task {
    _textEditor: vscode.TextEditor;
    _title: any;
    _toggles: any;
    _line: any;
    _range: vscode.Range;
    
    get getRange():vscode.Range {
        return this._range;
    }

    get getInfo():string {
        return this._title;
    }

    get isActive():boolean {
        return this._toggles.length % 2 == 1 ? true : false;
    }

    get getLine():Number{
        return this._range.start.line;
    }

    get getTitle():string{
        return this._title;
    }

    get countToggles(): number{
        return this._toggles.length; 
    }
    public getTimeStamp(index: number){
        return this._toggles[index];
    }

    public atLine(lineToCheck: Number): boolean{
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
        formattedTitle = formattedTitle.substring("- [ ] ".length);
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