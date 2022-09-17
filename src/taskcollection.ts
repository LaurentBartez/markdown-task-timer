import * as vscode from 'vscode';
import Task from "./task"

class TaskCollection extends Array<Task> {
    _textEditor: vscode.TextEditor;

    public getActiveTasks(): Task[]{
		let activeTasks:Task[] = [];
		this.forEach(element => {
			if (element.isActive){
				activeTasks.push(element);
			}
		});
		return activeTasks;
	}


    private getTasks(){
		var tasks:Task[] = [];
		if (!this._textEditor) {
			return;
		}
		const regEx = /- \[x\]|- \[ \]/g;
		const text = this._textEditor.document.getText();

		let match;
		const taskDeco: vscode.DecorationOptions[] = [];

		while ((match = regEx.exec(text))) {
 
			const startPos = this._textEditor.document.positionAt(match.index);
			const endPos = this._textEditor.document.lineAt(startPos).range.end;

			this.push(new Task(this._textEditor,new vscode.Range(startPos, endPos)));
		}		
	}

    constructor(textEditor: vscode.TextEditor,...items: Task[]) {
        super(...items);
        this._textEditor = textEditor || null;
        this.getTasks();

    }
    
}
export default TaskCollection;
