// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Tarball } from './tar';

interface IReadTarballFileOpts {
	tarballUri: string;
	fileName: string;
}
const COMMAND_READ_TARBALL_FILE = 'tarball-viewer.readTarballFile';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand(COMMAND_READ_TARBALL_FILE, onReadTarballFile));
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('tarball', new TarballContentProvider()));
	context.subscriptions.push(vscode.window.registerCustomEditorProvider('tarball-viewer.tarballPreview', new TarballEditorProvider()));
}

class TarballEditorProvider implements vscode.CustomReadonlyEditorProvider<TarballDocument> {
	openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): TarballDocument | Thenable<TarballDocument> {
		return new TarballDocument(uri);
	}
	resolveCustomEditor(document: TarballDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
		webviewPanel.webview.options = {
			enableCommandUris: true,
		};
		return new Promise(async resolve => {
			const links = (await document.getListing())
				.map(file => `<a href=${document.getUriFor(file)}>${file}</a>`);
			webviewPanel.webview.html = `
			<!DOCTYPE html>
			<html lang="en">
			<body>
				<div>
					${links.join('<br>')}
				</div>
			</body>
			</html>
			`;
			resolve();
		});
	}
}

class TarballDocument implements vscode.CustomDocument {
	private tarball: Tarball;
	constructor(readonly uri: vscode.Uri) {
		this.tarball = new Tarball(uri.fsPath);
	}
	dispose(): void {
		// TODO
	}
	public async getListing(): Promise<string[]> {
		return this.tarball.listContent();
	}
	public getUriFor(listing: string): vscode.Uri {
		const opts: IReadTarballFileOpts = {
			tarballUri: this.uri.toString(),
			fileName: listing,
		};
		return vscode.Uri.parse(`command:${COMMAND_READ_TARBALL_FILE}?${encodeURIComponent(JSON.stringify([opts]))}`);
	}
}

class TarballContentProvider implements vscode.TextDocumentContentProvider {
	private emitter = new vscode.EventEmitter<vscode.Uri>();
	onDidChange?: vscode.Event<vscode.Uri> | undefined;
	constructor() {
		this.onDidChange = this.emitter.event;
	}
	provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
		return new Promise(async (resolve, reject) => {
			try {
				const uriString = uri.toString(true);
				const parts = uriString.split(':');
				console.log('got tarball uri', {uri: uriString, parts});
				const [tarballPath, filePath] = parts.slice(-2);
				const tarball = new Tarball(tarballPath);
				return resolve(tarball.getFileContent(filePath));
			} catch (err) {
				reject(err);
			}
		});
	}
}

async function onReadTarballFile(opts: IReadTarballFileOpts): Promise<void> {
	const uri = vscode.Uri.parse(`tarball:${opts.tarballUri}:${opts.fileName}`);
	const newdoc = await vscode.workspace.openTextDocument(uri); // calls back into the provider
	await vscode.window.showTextDocument(newdoc, { preview: false });
}

// this method is called when your extension is deactivated
export function deactivate() {}
