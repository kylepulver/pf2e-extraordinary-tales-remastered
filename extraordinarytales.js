console.log("Extraordinary Tales | Loaded");

Hooks.on("init", () => {
    game.extraordinarytales = {
        activatePersonalXP: async (actor) => {
            const personalxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'personalxp') ?? 0);
            const newpersonalxp = game.extraordinarytales.spendXP(personalxp);

            if (!personalxp) {
                ui.notifications.warn("Not enough XP!")
                return;
            }

            const collateralxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);
            const newcollaterapxp = collateralxp + 1;

            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'personalxp', newpersonalxp);
            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'collateralxp', newcollaterapxp);

            ChatMessage.create({
                content: `<div style="font-size:120%"><i class="fa-solid fa-star"></i> Personal XP ${personalxp} <i class="fa-solid fa-arrow-right"></i> ${newpersonalxp}</div><div style="font-size:120%"><i class="fa-regular fa-star"></i> Collateral XP ${collateralxp} <i class="fa-solid fa-arrow-right"></i> ${newcollaterapxp}</div>`
            })
        },
        activateCollateralXP: async (actor) => {
            const collateralxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);
            const newcollateralxp = game.extraordinarytales.spendXP(collateralxp);

            if (!collateralxp) {
                ui.notifications.warn("Not enough XP!")
                return;
            }

            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'collateralxp', newcollateralxp);

            ChatMessage.create({
                content: `<div style="font-size:120%"><i class="fa-solid fa-star"></i> Collateral XP ${collateralxp} <i class="fa-solid fa-arrow-right"></i> ${newcollateralxp}</div>`
            })
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
        getScuffDamage: async (strike) => {
            let result = 0;
            // console.log(strike);
            await strike.damage({
                event: new MouseEvent("click", {shiftKey:true}),
                callback: async (d) => {
                    // console.log(d);
                    d.instances.forEach(i => {
                        i.type
                    })
                    if (strike.weapon?.parent?.type == "npc") {
                        // const ability = strike.item.defaultAttribute
                        const mod = Math.max(strike.item.parent.system.abilities.str.mod, 0);
                        result = mod + d.dice[0].results.length;
                    }
                    else {
                        result = d.options.damage.modifiers.filter(m => m.modifier && m.enabled).map(m => m.modifier).reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                    }
                },
                createMessage: false
            });
            return result;
        },
        promptPersonalXP: async () => {
            const actor = game.user.character;
            const xp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'personalxp') ?? 0);
          
        //     const doc = await fromUuid("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.ZL92qElc3fNO6U7T")
            
        //     const json = doc.toJSON();
        // const actor =
        //   canvas.tokens.controlled[0]?.actor ?? // Selected token's corresponding actor
        //   game.user?.character ?? // Assigned actor
        //   new Actor({ name: game.user.name, type: "character" }); // Dummy actor fallback

        // await new doc.constructor(json, { parent: actor }).toChat();

            const content = `<div style="text-align:center;padding:0.5em;align-items:center" class="flexrow"><div>Personal XP: ${xp}<div style="font-size:125%">Uses Remaining: <strong>${game.extraordinarytales.getUsagesFromXP(xp)}</strong></div></div><div><div>Abilities</div>` + await TextEditor.enrichHTML(`@UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.ZL92qElc3fNO6U7T]{Heroic Harmony} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.rdprmdU1JQ0IVAVn]{Rapid Response} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.Xv0Bn4TdsNHgZFHf]{Ensure Endeavor}`) + `</div></div>`
            let d = new Dialog({
                title: "Use Personal XP Ability",
                content: content,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Use Personal Ability`,
                        callback: async () => {
                            await game.extraordinarytales.activatePersonalXP(actor)
                        }
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {}
                    }
                },
                default: "two",
                render: html => {},
                close: html => {}
            })
            d.position.width = 500;
            d.render(true);
        },
        promptCollateralXP: async () => {
            const actor = game.user.character;
            const xp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);

            const content = `<div style="text-align:center;padding:0.5em;align-items:center" class="flexrow"><div>Collateral XP: ${xp}<div style="font-size:125%">Uses Remaining: <strong>${game.extraordinarytales.getUsagesFromXP(xp)}</strong></div></div><div><div>Abilities</div>` + await TextEditor.enrichHTML(`@UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.rnsVkUEavmw6dl0B]{Daring Determination} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.Sye4A4BHZWpkn1Pz]{Shared Struggle} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.hZxUrDV2W7a4PZw2]{Tandem Tactics}`) + `</div></div>`


            const info = `<div>${xp} (${game.extraordinarytales.getUsagesFromXP(xp)})</div></div>`
            let d = new Dialog({
                title: "Use Collateral XP Ability",
                content: content,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Use Collateral Ability`,
                        callback: async () => {
                            await game.extraordinarytales.activateCollateralXP(actor)
                        }
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {}
                    }
                },
                default: "two",
                render: html => {},
                close: html => {}
            })
            d.position.width = 500;
            d.render(true);
           

        },
        openRules: async () => {
            const docs = await game.packs.get("pf2e-extraordinary-tales-remastered.extraordinary-tales-rules").getDocuments();
            const doc = docs[0];
            
            doc.sheet.render(true, { mode: JournalSheet.VIEW_MODES.MULTIPLE });
        },
        createMacros: async () => {
            if (!game.user.isGM) return;

            const macroData = [{
                name: "Extraordinary Tales Menu",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.openEditor();",
                ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER }
            }, {
                name: "Activate Personal XP Ability",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.promptPersonalXP();",
                ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER }
            }, {
                name: "Activate Collateral XP Ability",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.promptCollateralXP();",
                ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER }
            }, {
                name: "Extraordinary Tales Rules",
                type: CONST.MACRO_TYPES.SCRIPT,
                command: "game.extraordinarytales.openRules();",
                ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER }
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
                const macros = await member.getFlag("pf2e-hud", "macros") ?? {};
                for (const user of game.users) {
                    if (user.character?.id == member.id) {
                        macros[user.id] = macros[user.id] ?? [];
                        for (const uuid of uuids) {
                            if (!macros[user.id].includes(uuid)) {
                                macros[user.id].push(uuid);
                            }
                        }
                        await member.setFlag("pf2e-hud", "macros", macros)
                    }
                }
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

    html.on("click", "[data-action=scuff-damage]",async (ev) => {
        const id = $(ev.currentTarget).closest("[data-message-id]").data("message-id")
        const message = game.messages.get(id);
        if (message._strike) {
            const scuff = await game.extraordinarytales.getScuffDamage(message._strike)
            const type = message._strike.item.baseDamage.damageType;
            // await new Roll(`(${scuff})[${type}]`).toMessage();
            ui.chat.processMessage(`/r (${scuff})[${type}] #<b>Scuff Damage</b>`, {
                speaker: message.speaker
            })
            // console.log(message);
        }
    })
});

Hooks.on("renderChatMessage", async (message, html, messageData) => {
    if (message._strike) {
        const scuff = await game.extraordinarytales.getScuffDamage(message._strike)
        html.find(".message-buttons .success").before(`<button style="font-size:80%" data-action="scuff-damage"  >Scuff ${scuff}</button>`);
        // await message._strike.damage({
        //     event: new MouseEvent("click", {shiftKey:true}),
        //     callback: async (d) => {
        //         if (message.flags.pf2e.context.options.includes("self:type:npc")) {
        //             const mod = Math.max(message._strike.item.parent.system.abilities.str.mod, 0);
        //             const scuff = mod + d.dice[0].results.length;
        //             html.find(".message-buttons .success").before(`<button style="font-size:80%" data-action="scuff-damage" data-tooltip="${d.formula}">Scuff ${scuff}</button>`);
        //         }
        //         else {
        //             const scuff = d.options.damage.modifiers.filter(m => m.modifier && m.enabled).map(m => m.modifier).reduce((accumulator, currentValue) => accumulator + currentValue, 0)
        //             html.find(".message-buttons .success").before(`<button style="font-size:80%" data-action="scuff-damage" data-tooltip="${d.formula}">Scuff ${scuff}</button>`);
        //         }
        //     },
        //     createMessage: false
        // })
    }
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

    appendhtml.on('click','button', async (ev) => {
        if (!game.user.isGM) {
            return;
        }

        let act = ev.currentTarget.dataset.action;
        if (act == "escup") {
            await game.combat.setFlag('pf2e-extraordinary-tales-remastered','escalation', esc + 1)
            ChatMessage.create( {
                content: `<div style="font-size:120%"><i class="fa-solid fa-star"></i> Escalation ${esc} <i class="fa-solid fa-arrow-right"></i> ${esc + 1}</div>`
            })
        }
        if (act == "escdown") {
            if (esc > 0) {
                await game.combat.setFlag('pf2e-extraordinary-tales-remastered','escalation', esc - 1)
                ChatMessage.create( {
                    content: `<div style="font-size:120%"><i class="fa-solid fa-star"></i> Escalation ${esc} <i class="fa-solid fa-arrow-right"></i> ${esc - 1}</div>`
                })
            }
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

    close(options) {
        game.actors.find(a => a.type == "party").members.forEach(m => {
            delete m.apps[this.id];
        })

        super.close(options);
    }

    activateListeners(html) {

        game.actors.find(a => a.type == "party").members.forEach(m => {
            m.apps[this.id] = this;
        })

        html.on("click", "[data-action]", async (ev) => {
            // console.log(ev);
            const action = ev.currentTarget.dataset.action;
            const target = $(ev.currentTarget).closest("[data-target]").data("target");
            const actorid = $(ev.currentTarget).closest("[data-actor]").data("actor");
            const actor = game.actors.get(actorid);

            // console.log(action, target, actor)

            if (target == "personalxp" || target == "collateralxp") {
                const xp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', target) ?? 0)
                if (action == "inc") {
                    await actor.setFlag('pf2e-extraordinary-tales-remastered', target, xp + 1)
                }
                if (action == "dec") {
                    await actor.setFlag('pf2e-extraordinary-tales-remastered', target, xp - 1)
                }
            }
            if (target == "heropoints") {
                if (action == "inc") {
                    if (actor.system.resources.heroPoints.value < actor.system.resources.heroPoints.max)
                        await actor.update({"system.resources.heroPoints.value": actor.system.resources.heroPoints.value + 1})
                }
                if (action == "dec") {
                    if (actor.system.resources.heroPoints.value > 0)
                        await actor.update({"system.resources.heroPoints.value": actor.system.resources.heroPoints.value - 1})
                }
            }
        })
    }
}


// Keep the higher roll from hero points
Hooks.on("getChatLogEntryContext", (application, options) => {
    const heroPoint = options.find(o => o.name == "PF2E.RerollMenu.HeroPoint")
    heroPoint.callback = ($li) => {
        const message = game.messages.get($li[0].dataset.messageId, { strict: true });
        game.pf2e.Check.rerollFromMessage(message, { heroPoint: true, keep: "higher" })
    }
    // console.log(heroPoint);
});

Hooks.on("ready", async () => {
    await game.extraordinarytales.createMacros();
    // new ExtraTalesEditorApplication().render(true);

    Handlebars.registerHelper('xpUses', function (xp) {
        return game.extraordinarytales.getUsagesFromXP(parseInt(xp) || 0)
    })
    

    if (!game.user.isGM) return;

    // configure some settings automatically
    if (game.modules.get("pf2e-hud")) {
    game.settings.set("pf2e-hud", "healthStatus", "Dead, Morbid, Morbid, Ragged, Ragged, Ragged, Bloodied, Bloodied, Bloodied, Bloodied, Bloodied, Injured, Injured, Injured, Injured, Injured, Injured, Injured, Scratched, Scratched, Unharmed");
    }
    else {
        ui.notifications.warn("Extraordinary Tales requires the PF2e Hud module for maximum functionality.")
    }

    if (game.modules.get("ez-mark-aid")) {
    }
    else {
        ui.notifications.warn("Extraordinary Tales requires the EZ Mark Aid module for maximum functionality.")
    }
})

Hooks.on("preUpdateActor", (document, changed, options, userId) => {
    // console.log(document, changed, options);
    if (changed.system?.resources?.heroPoints) {
        // console.log(document.system.resources.heroPoints.value);
        // console.log(changed.system.resources.heroPoints.value);
        // console.log("HERO POINTS")
    }
})

// Hooks.on("renderPartySheetPF2e", (app, html, data) => {
//     return;
//     console.log(app);

  

//     html.find(".sub-nav").append(`<a class="" data-tab="extratales" style="line-height:0.75;letter-spacing:-0.05em">Extraordinary Tales</a>`)

//     const exData = app.object;

//     let recentMessages = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.getFlag("ez-mark-aid", "marks") ?? false !== false);
//     let heroPoints = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.isReroll && (m.flavor ?? "").includes("fa-hospital-symbol") );
//     //&& !!m.flavor && m.flavor.contains("fa-hospital-symbol")

//     const aid = [];
//     recentMessages.forEach(m => {
//         const ids = m.flags["ez-mark-aid"].marks.id;
//         console.log(m);
//         Object.keys(ids).forEach(id => {
//             if (ids[id]) {
//                 const source = game.actors.get(m.speaker.actor);
//                 const actor = game.actors.get(id);
//                 if (!!source && !!actor) {
//                     aid.push({
//                         source: source,
//                         target: actor,
//                         message: m,
//                     });
//                 }
//             }
//         })
//     })

//     console.log(aid);
//     console.log(heroPoints);
//     // heroPoints.forEach(i => console.log(i.flavor))

//     exData.aid = aid;
//     exData.heroPoints = heroPoints;

//     renderTemplate("modules/pf2e-extraordinary-tales-remastered/editor.hbs", exData).then(result => {
//         html.find(".container").append(`<div class="tab extratales" data-tab="extratales">${result}</div>`)
//     })
// });



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