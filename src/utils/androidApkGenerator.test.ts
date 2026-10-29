import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPwaBuilderUrl,
  generateAndroidManifestXml,
  generateAppBuildGradle,
  generateStringsXml,
  AndroidApkConfig
} from './androidApkGenerator';

const testConfig: AndroidApkConfig = {
  appName: 'BranchLabs',
  packageName: 'com.branchlabs.app',
  appUrl: 'https://ais-pre-hlnojd5q2bpxuppsbcxz3p-5031448252.asia-southeast1.run.app',
  themeColor: '#0D1117',
  backgroundColor: '#0B0F17'
};

test('getPwaBuilderUrl generates valid PWABuilder link with encoded URL', () => {
  const url = getPwaBuilderUrl('https://example.com/chat');
  assert.ok(url.startsWith('https://www.pwabuilder.com/reportcard?site='));
  assert.ok(url.includes(encodeURIComponent('https://example.com/chat')));
});

test('generateAndroidManifestXml includes package name, intent filters, and host', () => {
  const xml = generateAndroidManifestXml(testConfig);
  assert.ok(xml.includes('package="com.branchlabs.app"'));
  assert.ok(xml.includes('com.google.androidbrowserhelper.trusted.LauncherActivity'));
  assert.ok(xml.includes('DEFAULT_URL'));
  assert.ok(xml.includes('ais-pre-hlnojd5q2bpxuppsbcxz3p-5031448252.asia-southeast1.run.app'));
});

test('generateAppBuildGradle configures SDK versions and AndroidBrowserHelper dependency', () => {
  const gradle = generateAppBuildGradle(testConfig);
  assert.ok(gradle.includes('applicationId "com.branchlabs.app"'));
  assert.ok(gradle.includes('compileSdk 34'));
  assert.ok(gradle.includes('com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'));
});

test('generateStringsXml sets correct app_name', () => {
  const strings = generateStringsXml('BranchLabs Studio');
  assert.ok(strings.includes('<string name="app_name">BranchLabs Studio</string>'));
});
