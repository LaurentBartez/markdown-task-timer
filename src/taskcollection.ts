import * as vscode from 'vscode';
import Task from "./task";
import * as moment from 'moment';
import { Align, getMarkdownTable } from 'markdown-table-ts';



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

	get getTimeTables(){
		const dataForge = require('data-forge');
		function getMd(df: any){
			df = df.withSeries({
				duration: (df: any) => df.deflate((row: any) => row.duration)
				.select((value: any) => value.toFixed(2))

			});
			df = df.toStrings("duration");

			const header = df.getColumnNames();
			const rows = df.toRows();
			const tableData = {
				table: {
					head: header,
					body: rows
				}
			};

			return getMarkdownTable(tableData);
		};

		var df = new dataForge.DataFrame({columns:this.getEntries});
		df = df.orderBy((row: { startEntry: any; }) => row.startEntry);
		console.log(df.toArray());
		const startDays = df.getSeries('startDay');
		const uniqueDays = startDays.distinct();

		// make dailies
		var timeTable:string = "";
		var durationTable:string = "";

		uniqueDays.forEach((day: any) => {
			var filtered = df.where((row:any) => row.startDay === day);
			const sum = filtered.getSeries('duration').sum().toFixed(2);
			
			timeTable += "### " + day.toString() + "\n\n";
			
			timeTable += getMd(filtered.subset(['title','start','end','duration']));
			timeTable += "\n\n";
			timeTable += "Total duration: " + sum + "h\n\n";

			durationTable += "### " + day.toString() + "\n\n";
			
			const pivotted = filtered.pivot("title", "duration", (series: { sum: () => any; }) => series.sum());
			durationTable += getMd(pivotted.subset(['title','duration']));
			durationTable += "\n\n";
			durationTable += "Total duration: " + sum + "h\n\n";

		});

		// make total
		var totalDuration:string = "";
		const pivottedTotal = df.pivot("title", "duration", (series: { sum: () => any; }) => series.sum());
		totalDuration += getMd(pivottedTotal.subset(['title','duration']));
		totalDuration += "\n\n";

		var table: string = "# Report";
		table += "\n\n";
		table += "## Daily log";
		table += "\n\n";
		table += timeTable;
		table += "\n";
		table += "## Daily duration";
		table += "\n\n";
		table += durationTable;
		table += "\n";
		table += "## Total duration";
		table += "\n\n";
		table += totalDuration;


		return table;
	}

	get getEntries(){
		var titles:string[] =[];
		var starts: string[] =[];
		var ends: string[] =[];
		var durations:number[]  =[];
		var startEntries:number[]  =[];
		var startDays:string[]  =[];


		this.forEach(task=>{
			var timeEntries = task.getTable;
			timeEntries.forEach(element=>{
				
					titles.push(task.getTitle);
					starts.push(moment(element._start.getTime()).format('HH:mm'));
					if (element._end !== null){
						ends.push(moment(element._end.getTime()).format('HH:mm'));
					}
					else{
						ends.push("");
					}
					durations.push(element._durationMs / 1000 / 60 / 60);
					startDays.push(moment(element._start.getTime()).format('YYYY-MM-DD'));
					startEntries.push(element._start.getTime());

				
			});
		});
		var data ={
			title: titles,
			start: starts,
			end: ends,
			duration: durations,
			startDay: startDays,
			startEntry: startEntries
		};
		return data;
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
