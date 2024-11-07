console.log("Extraordinary Tales | Loaded");


Hooks.on("init", () => {
    game.extraordinarytales = {
        activatePersonalXP: async (actor) => {
            const personalxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'personalxp') ?? 0);
            const newpersonalxp = game.extraordinarytales.spendXP(personalxp);

            const collateralxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);
            const newcollaterapxp = collateralxp + 1;

            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'personalxp', newpersonalxp);
            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'collateralxp', newcollaterapxp);
        },
        activateCollateralXP: async (actor) => {
            const collateralxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);
            const newcollaterapxp = game.extraordinarytales.spendXP(collateralxp);

            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'collateralxp', newcollaterapxp);
        },
        getUsagesFromXP: (xp) => {
            if (parseInt(xp) < 1) return 0;
            return Math.floor(Math.log(xp) / Math.log(2)) + 1;
        },
        spendXP: (xp) => {
            return Math.floor(xp * 0.5);
        },
        openEditor: () => {
            new ExtraTalesEditorApplication().render(true);
        },
        promptPersonalXP: () => {

        },
        promptCollateralXP: () => {

        },
        openRules: () => {

        },
        createMacros: async () => {
            const macroData = [{
                name: "Extraordinary Tales Menu",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.openEditor();"
            }, {
                name: "Activate Personal XP Ability",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.promptPersonalXP();"
            }, {
                name: "Activate Collateral XP Ability",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.promptCollateralXP();"
            }, {
                name: "Extraordinary Tales Rules",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.openRules();"
            }]

            const uuids = [];

            macroData.forEach(async data => {
                const exists = game.macros.find(m => m.name == data.name)
                if (exists) {
                    uuids.push(exists.uuid);
                }
                else {
                    const macro = await Macro.create(data)
                    uuids.push(macro.uuid);
                }
            })
         
            const members = game.actors.find(a => a.type == "party").members;
            for (const member of members) {
                const macros = await member.getFlag("pf2e-hud", "macros");
                
                console.log(macros);
            }
        }
    };
});

// Rename the roll options to be clearer in adherence to Pathfinder 2e
Hooks.on('renderCheckModifiersDialog', (app, html, data) => {
    html.find(".roll-mode-panel option[value=publicroll]").text("Roll to All");
    html.find(".roll-mode-panel option[value=gmroll]").text("Roll to Self and GM");
    html.find(".roll-mode-panel option[value=selfroll]").text("Test Roll to Self");
    html.find(".roll-mode-panel option[value=blindroll]").text("Secret Roll to GM");
})

Hooks.on('renderChatLogPF2e', (app, html, data) => {
    $(".roll-type-select option[value=publicroll]").text("Roll to All");
    $(".roll-type-select option[value=gmroll]").text("Roll to Self and GM");
    $(".roll-type-select option[value=selfroll]").text("Test Roll to Self");
    $(".roll-type-select option[value=blindroll]").text("Secret Roll to GM");
});

// Extraordinary Tales Escalation rules
Hooks.on('updateCombat', (a, b, c, d) => {
    if (!game.user.isGM) {
        return;
    }

    let esc = parseInt(game.combat.getFlag('pf2e-extraordinary-tales-remastered','escalation') ?? 0);
    for (let c of game.combat.combatants) {
        let t = canvas.tokens.get(c.tokenId);
        let a = t.actor;
        if (a) {
            a.setFlag('pf2e-extraordinary-tales-remastered', 'escalation', esc)
        }
    }
})

Hooks.on('renderCombatTracker', (app, html, data) => {
    if (!game.combat) {
        return;
    }

    let esc = parseInt(game.combat.getFlag('pf2e-extraordinary-tales-remastered','escalation') ?? 0);

    let appendhtml = $(`<div class="flexrow" style="font-size:85%"><div>Escalation</div><div>${esc}</div><div><button type="button" data-action="escup">+</button></div><div><button type="button" data-action="escdown">-</button></div></div>`);

    appendhtml.on('click','button', (ev) => {
        if (!game.user.isGM) {
            return;
        }

        let act = ev.currentTarget.dataset.action;
        if (act == "escup") {
            game.combat.setFlag('pf2e-extraordinary-tales-remastered','escalation', esc + 1)
            ChatMessage.create( {
                content: `<i class="fa-solid fa-star"></i> Escalation (${esc}) <i class="fa-solid fa-arrow-right"></i> (${esc + 1})`
            })
        }
        if (act == "escdown") {
            game.combat.setFlag('pf2e-extraordinary-tales-remastered','escalation', esc - 1)
            ChatMessage.create( {
                content: `<i class="fa-solid fa-star"></i> Escalation (${esc}) <i class="fa-solid fa-arrow-right"></i> (${esc - 1})`
            })
        }
    })


    html.find('.encounters').after(appendhtml)
})

class ExtraTalesEditorApplication extends Application {
    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            height: 'auto',
            id: 'extratales-editor',
            template: 'modules/pf2e-extraordinary-tales-remastered/editor.hbs',
            title: "Extraordinary Tales",
            width: 600,
            classes: ["pf2e-extraordinary-tales-remastered"]
        };

        return foundry.utils.mergeObject(defaults, overrides);
    }

    getData(options) {
        const data = game.actors.find(a => a.type == "party");
        
        let recentMessages = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.getFlag("ez-mark-aid", "marks") ?? false !== false);
        let heroPoints = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.isReroll && (m.flavor ?? "").includes("fa-hospital-symbol") );
        //&& !!m.flavor && m.flavor.contains("fa-hospital-symbol")

        const aid = [];
        recentMessages.forEach(m => {
            const ids = m.flags["ez-mark-aid"].marks.id;
            // console.log(m);
            Object.keys(ids).forEach(id => {
                if (ids[id]) {
                    const source = game.actors.get(m.speaker.actor);
                    const actor = game.actors.get(id);
                    if (!!source && !!actor) {
                        aid.push({
                            source: source,
                            target: actor,
                            message: m,
                        });
                    }
                }
            })
        })

        // console.log(aid);
        // console.log(heroPoints);
        // heroPoints.forEach(i => console.log(i.flavor))

        data.aid = aid;
        data.heroPoints = heroPoints;

        return data;
    }
}


Hooks.on("ready", async () => {
    await game.extraordinarytales.createMacros();
    new ExtraTalesEditorApplication().render(true);
    // game.actors.find(a => a.type == "party").sheet.render(true);
    
})

Hooks.on("updateActor", (document, changed, options, userId) => {
    console.log(changed);
})

Hooks.on("renderPartySheetPF2e", (app, html, data) => {
    console.log(app);

  

    html.find(".sub-nav").append(`<a class="" data-tab="extratales" style="line-height:0.75;letter-spacing:-0.05em">Extraordinary Tales</a>`)

    const exData = app.object;

    let recentMessages = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.getFlag("ez-mark-aid", "marks") ?? false !== false);
    let heroPoints = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.isReroll && (m.flavor ?? "").includes("fa-hospital-symbol") );
    //&& !!m.flavor && m.flavor.contains("fa-hospital-symbol")

    const aid = [];
    recentMessages.forEach(m => {
        const ids = m.flags["ez-mark-aid"].marks.id;
        console.log(m);
        Object.keys(ids).forEach(id => {
            if (ids[id]) {
                const source = game.actors.get(m.speaker.actor);
                const actor = game.actors.get(id);
                if (!!source && !!actor) {
                    aid.push({
                        source: source,
                        target: actor,
                        message: m,
                    });
                }
            }
        })
    })

    console.log(aid);
    console.log(heroPoints);
    // heroPoints.forEach(i => console.log(i.flavor))

    exData.aid = aid;
    exData.heroPoints = heroPoints;

    renderTemplate("modules/pf2e-extraordinary-tales-remastered/editor.hbs", exData).then(result => {
        html.find(".container").append(`<div class="tab extratales" data-tab="extratales">${result}</div>`)
    })
});



// XP rules

/* feature list:

extra tales screen

extra tales buttons

modify personal xp
activate personal xp

modify collateral xp
activate collateral xp

modify hero points


make hero points keep the highest
override rerolls

include compendium of rules

heroic bonus type

escalation
combat interface controls

scrape damage

d4 weapon traits

reflection rules text



*/