// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { start } from 'repl';
import * as vscode from 'vscode';
import Task from './task';
import TimerStatusBarItem from "./timerStatusBarItem"


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "markdown-todo-timer" is now active!');
	const statusBarItem = new TimerStatusBarItem();

	function getActiveTasks(tasks:Task[]): Task[]{
		let activeTasks:Task[] = [];
		tasks.forEach(element => {
			if (element.isActive){
				activeTasks.push(element);
			}
		});
		return activeTasks;
	}

	function handleTimer(){

		const tasks:Task[] = getTasks();
		const activeTasks = getActiveTasks(tasks);
		if (activeTasks.length > 0)
		{
			statusBarItem.setTask(activeTasks[0]);
		}
		else
		{
			statusBarItem.removeTask;
		}
	}

	// This function shall toggle a timer for a given task.
	// if an active task is in editor it will be toggled whereever it is
	// in case of no active task, the one in selected line will be toggled
	let disposable = vscode.commands.registerCommand('markdown-todo-timer.toggleTimer', () => {
		
		//check if selected line is a task
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return
		}

		const tasks:Task[] = getTasks();
		const activeTasks = getActiveTasks(tasks);
		const currentLine = activeEditor.selection.active.line;
		if (activeTasks.length == 0){
		
			//no task is active start task in current line, if any
			tasks.forEach(element => {
				if (element.atLine(currentLine))
				{
					element.insertTimeStamp();
					console.log("Started timer for: " + element.getTitle)
					statusBarItem.setTask(element);
				}
			});
		}
		else
		{
			//one active task is there
			activeTasks[0].insertTimeStamp();
			console.log("Stopped timer for: " + activeTasks[0].getTitle)
			if (activeTasks.length == 1)
			{
				statusBarItem.removeTask();
			}
			else
			{
				statusBarItem.setTask(activeTasks[1]);
			}
		}
	});

	context.subscriptions.push(statusBarItem);
	context.subscriptions.push(disposable);


	let timeout: NodeJS.Timer | undefined = undefined;

	// create a decorator type that we use to decorate small numbers
	const activeTaskDecorationType = vscode.window.createTextEditorDecorationType({
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		after: {
            contentText: 'active',
            color: 'green',
          },
	});

	let activeEditor = vscode.window.activeTextEditor;

	function getTasks() : Task[]{
		var tasks:Task[] = [];
		if (!activeEditor) {
			return tasks;
		}
		const regEx = /- \[x\]|- \[ \]/g;
		const text = activeEditor.document.getText();

		let match;
		const taskDeco: vscode.DecorationOptions[] = [];

		while ((match = regEx.exec(text))) {
 
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.lineAt(startPos).range.end;

			tasks.push(new Task(activeEditor,new vscode.Range(startPos, endPos)));
		}
		return tasks;		
	}

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		const taskDeco: vscode.DecorationOptions[] = [];
		var tasks:Task[] = getTasks();

		tasks.forEach(element => {
			if (element.isActive){
				const decoration = { range: element.getRange};
				taskDeco.push(decoration);		
			}	
			
		});
		activeEditor.setDecorations(activeTaskDecorationType, taskDeco);

	}

	function triggerUpdateDecorations(throttle = false) {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (throttle) {
			timeout = setTimeout(updateDecorations, 500);
		} else {
			updateDecorations();
		}
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

	vscode.languages.registerHoverProvider('markdown', {
        provideHover(document, position, token) {
			if (!activeEditor) {
				return;
			}
			const regEx = /- \[x\]|- \[ \]/g;
			
			let match;
			while ((match = regEx.exec(document.lineAt(position).text))) {
				
				const range = document.lineAt(position).range;
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.lineAt(startPos).range.end;
	
				var task = new Task(activeEditor,range);
				return new vscode.Hover(task.getInfo,range)
			}


        }
    });
	handleTimer();

}

// this method is called when your extension is deactivated
export function deactivate() {}
