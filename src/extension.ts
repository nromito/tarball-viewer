// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { parse } from 'path';
import * as vscode from 'vscode';
import * as tar from 'tar-stream';
import { pipeline } from 'stream';
import { createReadStream } from 'fs';
import { createGunzip } from 'zlib';
import { Tarball } from './tar';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "tarball-viewer" is now active!');
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('tarball', new TarballContentProvider));
	const disposable = vscode.workspace.onDidOpenTextDocument(async doc => {
		console.log('doc opened', {doc: doc.fileName});
		const ext = parse(doc.fileName).ext;
		if (ext !== '.tgz') {return;}
		const uri = vscode.Uri.parse('tarball:' + doc.fileName);
		const newdoc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
		await vscode.window.showTextDocument(newdoc, { preview: false });
	});
	context.subscriptions.push(disposable);
}

class TarballContentProvider implements vscode.TextDocumentContentProvider {
	private emitter = new vscode.EventEmitter<vscode.Uri>();
	onDidChange?: vscode.Event<vscode.Uri> | undefined;
	constructor() {
		this.onDidChange = this.emitter.event;
	}
	provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		console.log('providing text doc content', {uri: uri.fsPath});
		return new Promise(async (resolve, reject) => {
			try {
				const tarball = new Tarball(uri.fsPath);
				const entries = await tarball.listContent();
				console.log('got entries', {entries});
				return resolve(entries.join('\n'));
			} catch (err) {
				console.log('failed to get content', {err});
				reject(err);
			}
		});
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
