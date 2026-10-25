#!/bin/sh
# Renders each plugin stage off-screen with fake Figma messages (macOS only).
# Output: plugin/screenshots/<theme>-<n>.png
set -e
cd "$(dirname "$0")/.."
mkdir -p screenshots .cache
[ -x .cache/snap ] || swiftc -O tools/snap.swift -o .cache/snap

NO_ANIMATION="const st=document.createElement('style'); st.textContent='*{transition:none!important;animation:none!important}'; document.head.appendChild(st);"
SEND='const m = (x) => window.postMessage({ pluginMessage: x }, "*");'
LAYERS='[{id:"1",type:"FRAME",name:"Rachel Kenyani CV",depth:0},{id:"2",type:"FRAME",name:"Frame 54",depth:1,parentId:"1"},{id:"3",type:"FRAME",name:"Frame 103",depth:2,parentId:"2"},{id:"4",type:"TEXT",name:"RACHEL KENYANI",text:"RACHEL KENYANI",depth:3,parentId:"3"},{id:"5",type:"FRAME",name:"Frame 41",depth:3,parentId:"3"},{id:"6",type:"VECTOR",name:"Vector",depth:4,parentId:"5"},{id:"7",type:"INSTANCE",name:"Button",componentName:"Button/Primary",depth:2,parentId:"2"}]'
REPLY='{"renames":[{"id":"2","newName":"Resume Content","reason":"Holds the whole CV."},{"id":"3","newName":"Profile Header","reason":"Name and title block."},{"id":"5","newName":"Contact Row","reason":"Location and email."},{"id":"6","newName":"Location Icon","reason":"Pin icon shape."}]}'
FAKE_AI="window.fetch = async () => new Response(JSON.stringify({choices:[{message:{content: JSON.stringify($REPLY)}}]}), {status:200});"

for THEME in light dark; do
  perl -e 'alarm 90; exec @ARGV' .cache/snap dist/ui.html "screenshots/$THEME" \
    "{ $NO_ANIMATION $SEND m({type:'init',settings:null,preferences:{theme:'$THEME',namingStyle:'title'},selectionCount:0}); }" \
    "{ $FAKE_AI $SEND m({type:'saved-settings',settings:{provider:'openai',apiKey:'sk-proj-xxxxxxxxxxxxxxxx0cdb'}}); m({type:'scan-result',layers:$LAYERS,skippedCount:1,limitReached:false}); setTimeout(()=>document.querySelector('.tree-toggle').click(),100); }" \
    "{ [...document.querySelectorAll('.button-primary')].find((b)=>b.textContent.includes('Suggest')).click(); }" \
    "{ document.querySelectorAll('.suggestion .checkbox')[1].click(); document.querySelector('.reason .link-button').click(); }" \
    "{ $SEND m({type:'renames-applied',renamedCount:3,missedCount:1}); }"
done
echo "Saved to plugin/screenshots/"
