// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import TaskCollection from './taskcollection';
import Task from './task';
import TimerStatusBarItem from "./timerStatusBarItem";
import * as moment from 'moment';

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
		var allDocs: vscode.TextDocument[] = new Array();
		allDocs = [activeEditor.document];
		const tasks:TaskCollection = new TaskCollection(allDocs);
		const activeTasks = tasks.getActiveTasks();

		if (activeTasks.length > 0)
		{
			statusBarItem.setTask(activeTasks[0]);
		}
		else
		{
			statusBarItem.removeTask();
		}
	}

	// This function gets the date from userInput. 
	// Purpose is too handle user input in case of relative dates to the current one 
	function getDateFromInput(input: string, isStartDate: boolean): string {
		var result: string = "";
		var dateType: moment.unitOfTime.StartOf = null;
		var offsetType: moment.unitOfTime.DurationConstructor = 'weeks';// TODO: initialization can probably be done better

		// get the type of request
		if (input.startsWith('day')) {
			dateType = 'day';
			offsetType = 'days';
		}
		else if (input.startsWith('week')) {
			dateType = 'week';
			offsetType = 'weeks';
		}
		else if (input.startsWith('month')) {
			dateType = 'month';
			offsetType = 'months';
		}
		else if (input.startsWith('year')) {
			dateType = 'year';
			offsetType = 'years';
		}
		
		if (dateType && offsetType !== undefined ){
			// check offset
			var sub: string[] = input.split('-');
			var mom: moment.Moment = moment();
			if (sub.length === 2){
				mom = moment().subtract(sub[1], offsetType);
			}
			else{
				sub = input.split('+');
				if (sub.length === 2){
					mom = moment().add(sub[1], offsetType);
				}
			}
			if (isStartDate){
				result = mom.startOf(dateType).format('YYYY-MM-DD');
			}
			else{
				result = mom.endOf(dateType).format('YYYY-MM-DD');
			}
		}
		else{
			result = input;
		}

		return result;
	}

	// This function toggles the task status in the active editor
	// @param promoteDemote: use 'true' for promote; 'false' for demote
	function toggleStatusInEditor(promoteDemote : boolean){
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}
		const selections = activeEditor.selections;
		const textEdits: vscode.TextEdit[] = [];
		selections.forEach(element => {
			var line = element.active.line;
			const task = new Task(activeEditor.document,activeEditor.document.lineAt(line).range);
			if (promoteDemote){
				textEdits.push(task.promote());
			}
			else{
				textEdits.push(task.demote());
			}
		});
		const workEdit = new vscode.WorkspaceEdit();
		workEdit.set(activeEditor.document.uri,textEdits);
		vscode.workspace.applyEdit(workEdit);
	};


	// This function shall toggle a timer for a given task.
	// if an active task is in editor it will be toggled whereever it is
	// in case of no active task, the one in selected line will be toggled
	let disposable = vscode.commands.registerCommand('markdown-task-timer.toggleTimer', () => {
		
		//check if selected line is a task
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}		
		var allDocs: vscode.TextDocument[] = new Array();
		allDocs = [activeEditor.document];
		const tasks:TaskCollection = new TaskCollection(allDocs);
		const activeTasks = tasks.getActiveTasks();

		const currentLine = activeEditor.selection.active.line;
		if (activeTasks.length === 0) {
			//no task is active start task in current line, if any
			tasks.forEach(element => {
				if (element.atLine(currentLine)) {
					if (!statusBarItem.isActive())
					{
						element.insertTimeStamp();
					}
					else {
						const fileInStatusBar = statusBarItem.fileName;
						const rangeInStatusBar = statusBarItem.range;
						statusBarItem.removeTaskAndInsertTimeStamp();
						vscode.window
						.showInformationMessage("Stopped a task in a different file. Toggle timer again to start this one.", "Go to stopped task")
						.then(answer => {
							if (answer === "Go to stopped task") {
								vscode.workspace.openTextDocument(fileInStatusBar).then(doc => {
									const activeTask = new Task(doc, rangeInStatusBar);
									activeTask.goToTask();
								});
							}
						});
					}
				}
			});
		}
		else {
			//one active task is there
			var activeTaskInDifferentFile = !statusBarItem.updateIsPossible(activeEditor.document);
			activeTasks[0].insertTimeStamp();
			if (statusBarItem.isActive() && statusBarItem.fileName !== activeTasks[0].fileName)
			{
				vscode.window
				.showInformationMessage("An task in this editor was set to inactive. However, the timer is still active from a task in a different file","Go to task")
				.then(answer => {
					if(answer === "Go to task"){
						statusBarItem.goToTask();
					}
				});
			}
		}
	});

	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand('markdown-task-timer.promoteTask', () => {
		toggleStatusInEditor(true);
	});
	context.subscriptions.push(disposable);
	
	disposable = vscode.commands.registerCommand('markdown-task-timer.demoteTask', () => {
		toggleStatusInEditor(false);
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('markdown-task-timer.makeReport', () => {

		//check if selected line is a task
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}

		var allDocs: vscode.TextDocument[] = new Array();
		allDocs = [activeEditor.document];
		const tasks: TaskCollection = new TaskCollection(allDocs);
		tasks.makeReport(new Date("1900-01-01T00:00:00"),new Date());
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('markdown-task-timer.makeReportWorkspace',async () => {

		// The code you place here will be executed every time your command is executed
        var startDefault: Date = new Date("1900-01-01T00:00:00");
        var endDefault: Date = new Date(); 

		var startDate = await vscode.window.showInputBox({
			placeHolder: "YYYY-MM-DD",
			prompt: "Enter start date for report. Use relative dates such as \"week\" or \"month-1\". Allowed Keywords are: day, week, month, year",
			value: (moment(startDefault)).format('YYYY-MM-DD')
		  });
		
		var endDate;  
		if (startDate)
		{
			endDate = await vscode.window.showInputBox({
				placeHolder: "YYYY-MM-DD",
				prompt: "Enter end date for report. Use relative dates such as \"week\" or \"month-1\". Allowed Keywords are: day, week, month, year",
				value: (moment(endDefault)).format('YYYY-MM-DD')
			});
		}

		if (startDate && endDate) {

			const files = await vscode.workspace.findFiles('**/*.md', '**/node_modules/**');
			var allDocs: vscode.TextDocument[] = new Array();
			for (const file of files) {
				const doc = await vscode.workspace.openTextDocument(file.path);
				allDocs.push(doc);
			};

			if (allDocs.length === 0) {
				vscode.window.showErrorMessage('no markdown files were found in workspace');
			}
			else {
				const tasks: TaskCollection = new TaskCollection(allDocs);
				if (tasks.length === 0) {
					vscode.window.showErrorMessage('no tasks were found in workspace');
				}
				startDate = getDateFromInput(startDate,true);
				endDate = getDateFromInput(endDate,false);

				tasks.makeReport(new Date(startDate + "T00:00:00"), new Date(endDate + "T23:59:59"));
			}
		}

	});
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
		var allDocs: vscode.TextDocument[] = new Array();
		allDocs = [activeEditor.document];
		const tasks:TaskCollection = new TaskCollection(allDocs);

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
			statusBarItem.updateTimer(editor.document);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations(true);
			statusBarItem.updateTimer(activeEditor.document);
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
				
				var task = new Task(activeEditor.document,range);
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
