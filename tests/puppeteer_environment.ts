import {readFile} from 'fs/promises';
import os from 'os';
import path from 'path';
import puppeteer from 'puppeteer';
import {TestEnvironment as NodeEnvironment} from 'jest-environment-node';
import { EnvironmentContext, JestEnvironmentConfig } from '@jest/environment';

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

class PuppeteerEnvironment extends NodeEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    // get the wsEndpoint
    const wsEndpoint = await readFile(path.join(DIR, 'wsEndpoint'), 'utf8');
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found');
    }

    // connect to puppeteer
    this.global.__BROWSER_GLOBAL__ = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
    });


  }

  async teardown() {
    if (this.global.__BROWSER_GLOBAL__) {
      this.global.__BROWSER_GLOBAL__.disconnect();
    }
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

export default PuppeteerEnvironment;
