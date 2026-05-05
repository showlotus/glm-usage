import * as vscode from 'vscode';

const KEY_NAME = 'glm-api-key';
const CONFIG_KEY = 'apiKey';

/** 保存 API Key，同时写入 globalState 和 settings.json */
export async function setKey(context: vscode.ExtensionContext, key: string): Promise<void> {
    await context.globalState.update(KEY_NAME, key);
    const config = vscode.workspace.getConfiguration('glmUsage');
    await config.update(CONFIG_KEY, key, vscode.ConfigurationTarget.Global);
}

/** 读取 API Key，优先从 settings.json 读取，其次 globalState */
export async function getKey(context: vscode.ExtensionContext): Promise<string | undefined> {
    const configKey = vscode.workspace.getConfiguration('glmUsage').get<string>(CONFIG_KEY);
    if (configKey) {
        return configKey;
    }
    return context.globalState.get<string>(KEY_NAME);
}

/** 删除 API Key，同时清除 globalState 和 settings.json */
export async function deleteKey(context: vscode.ExtensionContext): Promise<void> {
    await context.globalState.update(KEY_NAME, undefined);
    const config = vscode.workspace.getConfiguration('glmUsage');
    await config.update(CONFIG_KEY, undefined, vscode.ConfigurationTarget.Global);
}
