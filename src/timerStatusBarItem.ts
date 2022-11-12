'use strict';
import * as vscode from 'vscode';
import * as moment from 'moment';
import Task from './task';

class TimerStatusBarItem {
    _statusBarItem: vscode.StatusBarItem;
    _interval: any;
    _start: number;
    _fileName: string;
    _range: vscode.Range;

    public setTask(task: Task) {
        if (task.isActive) {
            this._start = task.getTimeStamp(task.countToggles - 1);
            this._fileName = task.fileName;
            this._range = task.getRange;
            this._statusBarItem.tooltip =  task.getInfo.appendMarkdown('<br>' + this._fileName);
        }
        else {
            this.removeTask();        
        }     
    }
    public goToTask(){
      var openPath = vscode.Uri.file(this._fileName);
      vscode.workspace.openTextDocument(openPath).then(doc => 
      {
          vscode.window.showTextDocument(doc).then(editor => 
          {
              editor.selections = [new vscode.Selection(this._range.start,this._range.end)]; 
              editor.revealRange(new vscode.Range(this._range.start,this._range.end));
          });
      });  
    }
  public removeTask() {
    this._start = 0;
    this._statusBarItem.tooltip = 'no active task';
    this._statusBarItem.hide();
    this._range = new vscode.Range(0, 0, 0, 0);
    this._fileName = "";
    }  
  constructor() {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -100) || null;
    this._statusBarItem.tooltip =  'no active task';
    this._statusBarItem.command = "markdown-task-timer.GoToActiveTask";
    
    this._start = 0;
    this._statusBarItem.hide();
    this._fileName = "";
    this._range = new vscode.Range(0,0,0,0);
    this._interval = setInterval(() => this.refreshUI(), 1000);
    this.refreshUI();
  }

  dispose() {
    this._statusBarItem.dispose();
    clearInterval(this._interval);
  }

  refreshUI() {
    if (this._start === 0){
        this._statusBarItem.text =  'no active task';
        this._statusBarItem.hide();

    }
    else{
        const currentDate = new Date;
        const start = new Date(this._start);
        this._statusBarItem.text = moment.utc(currentDate.getTime() - start.getTime()).format('HH:mm:ss');
        this._statusBarItem.show();
    }
  }
}

export default TimerStatusBarItem;