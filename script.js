// ==UserScript==
// @name         AAC-Script
// @namespace    http://tampermonkey.net/
// @version      1.5.6
// @description  adds usefull tools to the Agile Accelerator Console
// @author       Emmanuel Turbet-Delof
// @updateURL    https://github.com/ETD-BIO/AAC-Script/raw/master/script.js
// @downloadURL  https://github.com/ETD-BIO/AAC-Script/raw/master/script.js
// @match        https://biomerieux--agile.sandbox.lightning.force.com/lightning/r/agf__ADM_Work__c/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=biomerieux.com
// @grant        none
// ==/UserScript==

(function () {
    'use script';

    const MAX_ATTEMPTS = 20;
    const TIMEOUT = 100;
    const CURRENT_TAB = 'div.split-right > section[aria-expanded="true"]';
    const SFDX_PULL = 'https://github.com/biomerieux/sfdx/pull/';

    let lastPR;
    let onetime = false;
    let docu = document;

    runWhenReady(lookForHeader, showScriptDesc);

    /*
    Query Functions
    */
    function lookForHeader() {
        return docu ? querySelect('#oneHeader > div:nth(1) > div > span') : false;
    }

    function lookForWorkName() {
        return querySelect(CURRENT_TAB + ' lightning-formatted-text:nth(1)');
    }

    function lookForPullRequest() {
        const recordType = querySelect(CURRENT_TAB + ' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(6) p:nth(2)');
        const sectionNb = recordType?.innerText == 'Bug' ? 2 : 3;
        return querySelect(CURRENT_TAB + ` flexipage-component2:nth(1) layout-section:nth(${sectionNb}) layout-row:nth(3) layout-item:nth(1) lightning-formatted-text`);
    }

    function querySelect(query) {
        return docu.querySelector(query.replace(/:nth/g, ':nth-of-type').replace(/layout/g, 'records-record-layout'));
    }

    /*
    Action Functions
    */
    function showScriptDesc(node) {
        const desc =
              'Feature Branch Name Generator CTRL + SHIFT + F\n' +
              'Open last PullRequest CTRL + SHIFT + P';
        node.innerHTML += ` <span title='${desc}' style='background-color:green;color:white;border-radius:20px;padding:0 5px 0 5px;'>Boosted</span>`;
    }

    function createGithubPullRequestLinks(node) {
        if (node.innerText) {
            const prs = node.innerText.match(/\d{4}/g);
            if (prs) {
                prs.sort();
                lastPR = prs[prs.length-1];
                node.innerHTML = prs.map(pr => `<a target='_blank' href='${SFDX_PULL}${pr}'>#${pr}</a>`).join(' - ');
            }
        }
    }

    function genFeatureBranchName(node) {
        const recordType = querySelect(CURRENT_TAB + ' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(6) p:nth(2)');
        const assigned = querySelect(CURRENT_TAB + ' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(2) p:nth(2) records-hoverable-link span');
        const prType = recordType?.innerText == 'Bug' ? 'fix' : 'feature';
        const workName = cleanWorkName(node).toLowerCase();
        const acronym = assigned?.innerText.match(/\b\w/g).join('').toLowerCase();
        const string = `${prType}/cpq-${workName}-${acronym}`;

        // Copy to clipboard
        const clipboardData = [new ClipboardItem({"text/plain":new Blob([string],{type:"text/plain"})})];
        navigator.clipboard.write(clipboardData).then(
            () => alert(`${string}\n\nCopied to clipboard successfully!`),
            () => alert(`${string}\n\nUnable to write to clipboard. :-(`)
        );
    }

    function cleanWorkName(node) {
        return node.innerText.replace(/[^a-z0-9 -]/gi,' ').replace(/ +/g, '-');
    }

    function runOneTime(callback1, callback2, bool) {
        if(!bool) {
            onetime = !onetime;
            runWhenReady(callback1, callback2);
        }
    }

    function runWhenReady(queryFunc, actionFunc) {
        let ctn = 0;
        function tryNow() {
            const elem = queryFunc();
            if (elem) {
                actionFunc(elem);
            } else {
                ctn++;
                if (ctn >= MAX_ATTEMPTS) {
                    console.warn(`Giving up 'runWhenReady' after ${MAX_ATTEMPTS} attempts.`);
                } else {
                    setTimeout(tryNow, TIMEOUT);
                }
            }
        }
        tryNow();
    }

    // Refresh the DOM in order to catch the good work name
    document.addEventListener('DOMSubtreeModified', (e) => {
        docu = e.target.ownerDocument.documentElement;
        runOneTime(lookForPullRequest, createGithubPullRequestLinks, onetime);
    });

    // Listen keyboard and mouse events
    window.addEventListener("click", (e) => {
        onetime = !onetime;
    });

    window.addEventListener("keydown", (e) => {
        //console.log('KEY :' + e.key);
        if (e.ctrlKey && e.shiftKey) {
            switch (e.key) {
                case 'F': // for Feature
                    runWhenReady(lookForWorkName, genFeatureBranchName);
                    break;
                case 'P': // for PullRequest
                    if (lastPR) {
                        window.open(SFDX_PULL+lastPR);
                    } else {
                        alert('No PR link !');
                    }
                    break;
            }
        }
    });
    console.log('AAC-Script loaded');
})();
