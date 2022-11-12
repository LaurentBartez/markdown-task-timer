// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import TaskCollection from './taskcollection';
import Task from './task';
import TimerStatusBarItem from "./timerStatusBarItem";


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "markdown-task-timer" is now active!');
	const statusBarItem = new TimerStatusBarItem();

	function handleTimer(){
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}

		const tasks:TaskCollection = new TaskCollection(activeEditor);
		const activeTasks = tasks.getActiveTasks();

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
	let disposable = vscode.commands.registerCommand('markdown-task-timer.toggleTimer', () => {
		
		//check if selected line is a task
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}

		const tasks:TaskCollection = new TaskCollection(activeEditor);
		const activeTasks = tasks.getActiveTasks();
		
		const currentLine = activeEditor.selection.active.line;
		if (activeTasks.length === 0){
			//no task is active start task in current line, if any
			tasks.forEach(element => {
				if (element.atLine(currentLine))
				{
					element.insertTimeStamp();
				}
			});
		}
		else
		{
			//one active task is there
			activeTasks[0].insertTimeStamp();
		}
	});

	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('markdown-task-timer.promoteTask', () => {
		
		//check if selected line is a task
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}

		const task = new Task(activeEditor,activeEditor.document.lineAt(activeEditor.selection.active.line).range);
		task.promote();

	});
	context.subscriptions.push(disposable);
	
	disposable = vscode.commands.registerCommand('markdown-task-timer.demoteTask', () => {
		
		//check if selected line is a task
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}

		const task = new Task(activeEditor,activeEditor.document.lineAt(activeEditor.selection.active.line).range);
		task.demote();

	});
	context.subscriptions.push(disposable);


	disposable = vscode.commands.registerCommand('markdown-task-timer.makeReport', () => {
		
		//check if selected line is a task
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}
		var tasks = new TaskCollection(activeEditor);
		const timeTable: string = tasks.getTimeTables; 
		vscode.workspace.openTextDocument({
			content: timeTable,
			language: "markdown"
		}).then(newDocument => {
			vscode.window.showTextDocument(newDocument);
		});	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('markdown-task-timer.GoToActiveTask', () => {
		
		//Sets cursor to the current active task of timer
		statusBarItem.goToTask();

	});
	context.subscriptions.push(disposable);


	context.subscriptions.push(statusBarItem);


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

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}

		const taskDeco: vscode.DecorationOptions[] = [];
		const tasks:TaskCollection = new TaskCollection(activeEditor);

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
			const tasks:TaskCollection = new TaskCollection(activeEditor);
			const activeTasks = tasks.getActiveTasks();
			if (activeTasks.length === 0)
			{
				statusBarItem.removeTask();
			}
			else
			{
				statusBarItem.setTask(activeTasks[0]);
			}
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
				
				const regExTimeStamp = /\[(.*?)\]/g;
				const range = document.lineAt(position).range;
				
				var task = new Task(activeEditor,range);
				const wordRange = document.getWordRangeAtPosition(position, regExTimeStamp);
				const timeInfo = task.timeStampInfo(document.getText(wordRange).slice(1,-1));
				console.log(timeInfo);
				if (timeInfo.value.length > 0)
				{
					return new vscode.Hover(timeInfo,wordRange);

				}
				else
				{
					return new vscode.Hover(task.getInfo,range);
				}
			}
        }
    });
	handleTimer();

}

// this method is called when your extension is deactivated
export function deactivate() {}
