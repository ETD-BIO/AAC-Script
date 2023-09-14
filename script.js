// ==UserScript==
// @name         AAC-Script
// @namespace    http://tampermonkey.net/
// @version      1.5.1
// @description  adds usefull tools to the Agile Accelerator Console
// @author       Emmanuel Turbet-Delof
// @match        https://biomerieux--agile.sandbox.lightning.force.com/lightning/r/agf__ADM_Work__c/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=force.com
// @grant        none
// ==/UserScript==

(function () {
    'use script';

    var pr_url = '';
    var onetime = false;
    var docu = document;
    var ini = "etd"; // initials, put at the end of the feature branch name

    runWhenReady(lookForHeader, showScriptDesc);

    /*
    Query Functions
    */
    function lookForHeader() {
        return docu ? docu.querySelector(reformat('#oneHeader > div:nth(1) > div > span')) : false;
    }

    function lookForWorkName(currentTab) {
        return docu.querySelector(currentTab + reformat(' lightning-formatted-text:nth(1)'));
    }

    function lookForPullRequest(currentTab) {
        const recordType = docu.querySelector('div.split-right > section[aria-expanded="true"]' + reformat(' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(6) p:nth(2)'));
        var sectionNb = recordType?.innerText == 'Bug' ? 2 : 3;
        return docu.querySelector(currentTab + reformat(' flexipage-component2:nth(1) layout-section:nth('+sectionNb+') layout-row:nth(3) layout-item:nth(1) lightning-formatted-text'));
    }

    function reformat(query) {
        return query
            .replaceAll(":nth", ":nth-of-type")
            .replaceAll("layout", "records-record-layout");
    }

    /*
    Action Functions
    */
    function showScriptDesc(node) {
        const desc = 'Feature Branch Name Generator CTRL + SHIFT + F&#10;';
        node.innerHTML += " <span title='"+desc+"' style='background-color:green;color:white;border-radius:20px;padding:0 5px 0 5px;'>Boosted</span>";
    }

    function createGithubPullRequestLinks(node) {
        //console.log('innerText : >' + node.innerText + '<');
        if (node.innerText) {
            const prs = node.innerText.split(",");
            var text = '';
            var cnt = 1;
            prs.sort();
            prs.forEach((pr) => {
                let pr_clean = pr.replace("#", "");
                let url = 'https://github.com/biomerieux/sfdx/pull/'+pr_clean;
                window.pr_url = url;
                text += '<a target="_blank" href="'+url+'">#'+pr_clean+'</a>';
                if (cnt < prs.length) {
                    text += ' - ';
                }
                cnt++;
            });
            node.innerHTML = text;
        } else {
            window.pr_url = undefined;
        }
    }

    function genFeatureBranchName(node) {
        const recordType = docu.querySelector('div.split-right > section[aria-expanded="true"]' + reformat(' flexipage-component2:nth(1) records-highlights2 > div > div:nth(2) records-highlights-details-item:nth(6) p:nth(2)'));
        const prType = recordType?.innerText == 'Bug' ? 'fix' : 'feature';
        var string = prType + "/cpq-" + cleanWorkName(node).toLowerCase() + "-" + ini;
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

    String.prototype.replaceAllIn = function (array, substitutes) {
        var str = this;
        if(array.length != substitutes.length) {
            throw 'Check cleanWorkName function : array do not corespond to substitutes !';
        }
        let i = 0;
        array.forEach((chars) => {
            chars.split('').forEach((char) => {
                if (char == ' ') {
                    str = str.replace(/\s+/g, ' ');
                }
                str = str.replaceAll(char, substitutes[i]);
            });
            i++;
        });
        return str;
    };

    function cleanWorkName(node) {
        return node.innerText.trim().replaceAllIn([':()"\',&.-','_ '], ['','-']).replaceAll('%', 'percent');
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
            var elem = queryFunc('div.split-right > section[aria-expanded="true"]'); // Target the current tab and not the all page
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
        var evtobj = window.event ? event : e;
        //console.log('KEY_CODE :' + evtobj.keyCode);
        if (evtobj.ctrlKey && evtobj.shiftKey) { // CTRL + SHIFT
            evtobj.returnValue = false;
            if (evtobj.keyCode == 70) { // + F (for Feature)
                runWhenReady(lookForWorkName, genFeatureBranchName);
            }
            if (evtobj.keyCode == 80) { // + P (for PullRequest)
                if (window.pr_url) window.open(window.pr_url, '_blank').focus();
                else alert('No PR link !');
            }
        }
    });
    console.log('AAC-Script loaded');
})();
