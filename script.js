// ==UserScript==
// @name         AAC-Script
// @namespace    http://tampermonkey.net/
// @version      1.5.5
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

    var pr_url = '';
    var onetime = false;
    var docu = document;
    var currentTab = 'div.split-right > section[aria-expanded="true"]';

    runWhenReady(lookForHeader, showScriptDesc);

    /*
    Query Functions
    */
    function lookForHeader() {
        return docu ? querySelect('#oneHeader > div:nth(1) > div > span') : false;
    }

    function lookForWorkName() {
        return querySelect(currentTab + ' lightning-formatted-text:nth(1)');
    }

    function lookForPullRequest() {
        const recordType = querySelect(currentTab + ' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(6) p:nth(2)');
        var sectionNb = recordType?.innerText == 'Bug' ? 2 : 3;
        return querySelect(currentTab + ' flexipage-component2:nth(1) layout-section:nth('+sectionNb+') layout-row:nth(3) layout-item:nth(1) lightning-formatted-text');
    }

    function querySelect(query) {
        return docu.querySelector(query
            .replaceAll(":nth", ":nth-of-type")
            .replaceAll("layout", "records-record-layout"));
    }

    /*
    Action Functions
    */
    function showScriptDesc(node) {
        const desc = 'Feature Branch Name Generator CTRL + SHIFT + F&#10;';
        node.innerHTML += " <span title='"+desc+"' style='background-color:green;color:white;border-radius:20px;padding:0 5px 0 5px;'>Boosted</span>";
    }

    function createGithubPullRequestLinks(node) {
        if (node.innerText) {
            const prs = node.innerText.match(/[0-9]{4}/g);
            const prs2 = [];
            prs.sort();
            prs.forEach(pr => {
                window.pr_url = 'https://github.com/biomerieux/sfdx/pull/'+pr;
                prs2.push('<a target="_blank" href="'+window.pr_url+'">#'+pr+'</a>');
            });
            node.innerHTML = prs2.join(' - ');
        } else {
            window.pr_url = undefined;
        }
    }

    function genFeatureBranchName(node) {
        const recordType = querySelect(currentTab + ' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(6) p:nth(2)');
        const assigned = querySelect(currentTab + ' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(2) p:nth(2) records-hoverable-link span');
        const prType = recordType?.innerText == 'Bug' ? 'fix' : 'feature';
        const acronym = assigned?.innerText.match(/\b\w/g).join('').toLowerCase();
        var string = prType + "/cpq-" + cleanWorkName(node).toLowerCase() + "-" + acronym;
        var data = [new ClipboardItem({"text/plain":new Blob([string],{type:"text/plain"})})];
        navigator.clipboard.write(data).then(
            function () {
                alert(string+"\n\nCopied to clipboard successfully!");
            },
            function () {
                alert(string+"\n\nUnable to write to clipboard. :-(");
            }
        );
    }

    function cleanWorkName(node) {
        return node.innerText.replace(/[^a-z0-9 -]/gi,' ').replace(/ +/g, '-');
    }

    // Run One time
    function runOneTime(callback1, callback2, bool) {
        if(!bool) {
            //console.log('RUN ONE TIME !');
            onetime = !onetime;
            runWhenReady(callback1, callback2);
        }
    }

    // Run action function when the element in page is found
    function runWhenReady(queryFunc, actionFunc) {
        var numAttempts = 0;
        var tryNow = function() {
            var elem = queryFunc();
            if (elem) {
                actionFunc(elem);
            } else {
                numAttempts++;
                if (numAttempts >= 20) {
                    console.log('Giving up \'runWhenReady\' after 20 attempts.');
                } else {
                    setTimeout(tryNow, 100);
                }
            }
        };
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
        if (e.ctrlKey && e.shiftKey) { // CTRL + SHIFT
            switch (e.key) {
                case 'F': // for Feature
                    runWhenReady(lookForWorkName, genFeatureBranchName);
                    break;
                case 'P': // for PullRequest
                    if (window.pr_url) window.open(window.pr_url, '_blank').focus();
                    else alert('No PR link !');
                    break;
            }
        }
    });
    console.log('AAC-Script loaded');
})();
