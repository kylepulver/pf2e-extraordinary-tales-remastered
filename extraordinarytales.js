console.log("Extraordinary Tales | Loaded");

const getMessage = (html) => {
    return game.messages.get($(html).data("messageId"))
}

Hooks.on("init", () => {
    game.extraordinarytales = {
        activatePersonalXP: async (actor) => {
            const personalxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'personalxp') ?? 0);
            const newpersonalxp = game.extraordinarytales.spendXP(personalxp);

            if (!personalxp) {
                ui.notifications.warn("Not enough XP!")
                return false;
            }

            const collateralxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);
            const newcollaterapxp = collateralxp + 1;

            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'personalxp', newpersonalxp);
            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'collateralxp', newcollaterapxp);

            ChatMessage.create({
                content: `<div style="font-size:120%"><i class="fa-solid fa-star"></i> Personal XP ${personalxp} <i class="fa-solid fa-arrow-right"></i> ${newpersonalxp}</div><div style="font-size:120%"><i class="fa-regular fa-star"></i> Collateral XP ${collateralxp} <i class="fa-solid fa-arrow-right"></i> ${newcollaterapxp}</div>`
            })

            return true;

        },
        activateCollateralXP: async (actor) => {
            const collateralxp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);
            const newcollateralxp = game.extraordinarytales.spendXP(collateralxp);

            if (!collateralxp) {
                ui.notifications.warn("Not enough XP!")
                return false;
            }

            await actor.setFlag('pf2e-extraordinary-tales-remastered', 'collateralxp', newcollateralxp);

            ChatMessage.create({
                content: `<div style="font-size:120%"><i class="fa-solid fa-star"></i> Collateral XP ${collateralxp} <i class="fa-solid fa-arrow-right"></i> ${newcollateralxp}</div>`
            })

            return true;
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
            
            await strike.damage({
                event: new MouseEvent("click", {shiftKey: game.user.settings["showDamageDialogs"]}),
                callback: async (d) => {
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
        post: async (uuid) => {
            const doc = await fromUuid(uuid)
                
            const json = doc.toJSON();
            const actor =
                canvas.tokens.controlled[0]?.actor ?? // Selected token's corresponding actor
                game.user?.character ?? // Assigned actor
                new Actor({ name: game.user.name, type: "character" }); // Dummy actor fallback

            await new doc.constructor(json, { parent: actor }).toChat();
        },
        promptPersonalXP: async (actor) => {
            actor = actor ?? game.user.character;
            const xp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'personalxp') ?? 0);
          
           

            const content = `<div style="text-align:center;padding:0.5em;align-items:center" class="flexrow"><div>Personal XP: ${xp}<div style="font-size:125%">Uses Remaining: <strong>${game.extraordinarytales.getUsagesFromXP(xp)}</strong></div></div><div><div>Abilities</div>` + await TextEditor.enrichHTML(`@UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.ZL92qElc3fNO6U7T]{Heroic Harmony} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.rdprmdU1JQ0IVAVn]{Rapid Response} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.Xv0Bn4TdsNHgZFHf]{Ensure Endeavor}`) + `</div></div>`
            let d = new Dialog({
                title: "Use Personal XP Ability",
                content: content,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Heroic Harmony`,
                        callback: async () => {
                            const result = await game.extraordinarytales.activatePersonalXP(actor)
                            if (result) await game.extraordinarytales.post("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.ZL92qElc3fNO6U7T")
                        }
                    },
                    two: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Rapid Response`,
                        callback: async () => {
                            const result = await game.extraordinarytales.activatePersonalXP(actor)
                            if (result) await game.extraordinarytales.post("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.rdprmdU1JQ0IVAVn")
                        }
                    },
                    three: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Ensure Endeavor`,
                        callback: async () => {
                            const result = await game.extraordinarytales.activatePersonalXP(actor)
                            if (result) await game.extraordinarytales.post("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.Xv0Bn4TdsNHgZFHf")
                        }
                    },
                    four: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {}
                    }
                },
                default: "four",
                render: html => {},
                close: html => {}
            })
            d.position.width = 500;
            d.render(true);
        },
        promptCollateralXP: async (actor) => {
            actor = actor ?? game.user.character;
            const xp = parseInt(actor.getFlag('pf2e-extraordinary-tales-remastered', 'collateralxp') ?? 0);

            const content = `<div style="text-align:center;padding:0.5em;align-items:center" class="flexrow"><div>Collateral XP: ${xp}<div style="font-size:125%">Uses Remaining: <strong>${game.extraordinarytales.getUsagesFromXP(xp)}</strong></div></div><div><div>Abilities</div>` + await TextEditor.enrichHTML(`@UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.rnsVkUEavmw6dl0B]{Daring Determination} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.Sye4A4BHZWpkn1Pz]{Shared Struggle} @UUID[Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.hZxUrDV2W7a4PZw2]{Tandem Tactics}`) + `</div></div>`

            let d = new Dialog({
                title: "Use Collateral XP Ability",
                content: content,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Use Collateral`,
                        callback: async () => {
                            await game.extraordinarytales.activateCollateralXP(actor)
                        }
                    },
                    two: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Daring Determination`,
                        callback: async () => {
                            const result = await game.extraordinarytales.activatePersonalXP(actor)
                            if (result) await game.extraordinarytales.post("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.rnsVkUEavmw6dl0B")
                        }
                    },
                    three: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Shared Struggle`,
                        callback: async () => {
                            const result = await game.extraordinarytales.activatePersonalXP(actor)
                            if (result)  await game.extraordinarytales.post("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.Sye4A4BHZWpkn1Pz")
                        }
                    },
                    four: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Tandem Tactics`,
                        callback: async () => {
                            const result = await game.extraordinarytales.activatePersonalXP(actor)
                            if (result) await game.extraordinarytales.post("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.hZxUrDV2W7a4PZw2")
                        }
                    },
                    five: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {}
                    }
                },
                default: "five",
                render: html => {},
                close: html => {}
            })
            d.position.width = 500;
            d.render(true);
        },
        setTerm: (roll, number, flavor = "adjust") => {
            let term = roll.terms.find(t => t.flavor == flavor) ?? false;

            if (!term) {
                term = new foundry.dice.terms.NumericTerm({number: 0, options:{flavor: flavor}});
                roll.terms.push(new foundry.dice.terms.OperatorTerm({operator:"+"}))
                roll.terms.push(term);
            }

            term.number = number;
            
            if (term.number == 0) {
                const idx = roll.terms.findIndex(t => t == term);
                roll.terms.splice(idx - 1, 2);
            }

            roll._total = roll._evaluateTotal();
            roll._formula = roll.formula;
        },
        addTerm: (roll, add, flavor = "adjust") => {
            let term = roll.terms.find(t => t.flavor == flavor) ?? false;

            if (!term) {
                term = new foundry.dice.terms.NumericTerm({number: 0, options:{flavor: flavor}});
                roll.terms.push(new foundry.dice.terms.OperatorTerm({operator:"+"}))
                roll.terms.push(term);
            }

            term.number += add;

            if (term.number == 0) {
                const idx = roll.terms.findIndex(t => t == term);
                roll.terms.splice(idx - 1, 2);
            }

            roll._total = roll._evaluateTotal();
            roll._formula = roll.formula;
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

    // game.pf2e.ModifierType["HEROIC"] = "heroic";
    // game.pf2e.ModifierType["ESCALATION"] = "escalation";
});

// Rename the roll options to be clearer in adherence to Pathfinder 2e
Hooks.on('renderCheckModifiersDialog', (app, html, data) => {
    html.find(".roll-mode-panel option[value=publicroll]").text("Roll to All");
    html.find(".roll-mode-panel option[value=gmroll]").text("Roll to Self and GM");
    html.find(".roll-mode-panel option[value=selfroll]").text("Test Roll to Self");
    html.find(".roll-mode-panel option[value=blindroll]").text("Secret Roll to GM");

    // html.find(".add-modifier-type").append(`<option value="heroic">Heroic</option>`)
    // html.find(".add-modifier-type").append(`<option value="escalation">Escalation</option>`)
    
    // console.log(app, data);
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
            ui.chat.processMessage(`/r (${scuff})[${type}] #<b>Scuff Damage</b>`, {
                speaker: message.speaker
            })
        }
    })
});

Hooks.on("renderChatMessage", async (message, html, messageData) => {
    if (message._strike) {
        const scuff = await game.extraordinarytales.getScuffDamage(message._strike)
        html.find(".message-buttons .success").before(`<button style="font-size:80%" data-action="scuff-damage"  >Scuff ${scuff}</button>`);
    }

    if (message.blind) // dont reformat secret rolls
        return;

    if (message.isCheckRoll) {
        html.find('.dice-formula').not('.reroll-discard .dice-formula').each(function(index, element) {
            let rollhtml = $(this).html();

            message.rolls[0].dice.forEach(d => {
                rollhtml = rollhtml.replace(d.expression, `<span data-tooltip="%%%%" style="font-size:var(--font-size-20)">[${d.values.join("+")}]</span>&nbsp;`);
            })

            message.rolls[0].dice.forEach(d => {
                rollhtml = rollhtml.replace("%%%%", d.expression);
            })

            $(this).html(rollhtml)
        })

    }

    if (message.isDamageRoll) {
        html.find('.dice-formula').each(function(index, element) {
            const elements = $(this).find('.instance');
            if (!elements.length) return; // If there are no damage instances, just escape.

            let instances = message.rolls[0].instances ?? [];

            if (index == 1) { // SPLASH DAMAGE ONLY
                instances = instances.filter(instance => instance.splash)
            }

            instances.forEach((instance, i) => {
                let instancehtml = $(elements[i]).html();
                if (instance.persistent) {
                }
                else {
                    instance.dice.forEach(d => {
                        instancehtml = instancehtml.replace(d.expression, `<span data-tooltip="%%%%"><span style="font-size:80%">[</span>${d.values.join(`<span style="font-size:80%">+</span>`)}<span style="font-size:80%">]</span></span>`)
                    })
                    instance.dice.forEach(d => {
                        instancehtml = instancehtml.replace("%%%%", d.expression)
                    })
                    instancehtml = instancehtml.split("2 * ").join(`2<span style="font-size:80%">&times;</span>`);
                    instancehtml = instancehtml.split(" + ").join(`<span style="font-size:80%">+</span>`);
                    $(elements[i]).html(instancehtml)
                    $(elements[i]).prepend(`<span style="font-size:var(--font-size-20)">${instance.total}</span><span style="font-size:80%">=</span>`)
                }

                $(elements[i]).find('i').addClass("fa-lg fa-fw")
                $(elements[i]).find('.splash i').removeClass("fa-lg fa-fw")
                $(elements[i]).find('.precision i').removeClass("fa-lg fa-fw").css({"font-size": "80%"})
            })

            // Strip out the extra "+" text
            $(this).html($(this).children())
        })
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
            id: 'extratales-editor',
            template: 'modules/pf2e-extraordinary-tales-remastered/editor.hbs',
            title: "Extraordinary Tales",
            width: 600,
            height: 600,
            classes: ["pf2e-extraordinary-tales-remastered"]
        };

        return foundry.utils.mergeObject(defaults, overrides);
    }

    getData(options) {
        const data = game.actors.find(a => a.type == "party");
        
        let recentMessages = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.getFlag("ez-mark-aid", "marks") ?? false !== false);

        let heroPoints = game.messages.filter(m => m.timestamp > Date.now() - 1000 * 60 * 60 * 24).filter(m => m.isReroll && (m.flavor ?? "").includes("fa-hospital-symbol") );

        const aid = [];
        recentMessages.forEach(m => {
            const ids = m.flags["ez-mark-aid"].marks.id;
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
            const action = ev.currentTarget.dataset.action;

            if (action == "personal") {
                if (game.user.isGM) return;
                game.extraordinarytales.activatePersonalXP(game.user.character);
                return;
            }
            if (action == "collateral") {
                if (game.user.isGM) return;
                game.extraordinarytales.activateCollateralXP(game.user.character);
                return;
            }
            if (action == "rules") {
                game.extraordinarytales.openRules();
                return;
            }

            const target = $(ev.currentTarget).closest("[data-target]").data("target");
            const actorid = $(ev.currentTarget).closest("[data-actor]").data("actor");
            const actor = game.actors.get(actorid);

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


Hooks.on("getChatLogEntryContext", (application, options) => {
    // Keep the higher roll from hero points
    const heroPoint = options.find(o => o.name == "PF2E.RerollMenu.HeroPoint")
    heroPoint.callback = ($li) => {
        const message = game.messages.get($li[0].dataset.messageId, { strict: true });
        game.pf2e.Check.rerollFromMessage(message, { heroPoint: true, keep: "higher" })
    }

    options.push({
        name: "Minimum Damage",
        condition: li => {
            const message = getMessage(li);
            return (message.isOwner || game.user.isGM) && message.isDamageRoll;
        },
        icon: `<i class="fas fa-circle-down"></i>`,
        callback: async li => {
            const message = getMessage(li);
            if (!message.getFlag("pf2e-extraordinary-tales-remastered", "original-rolls"))
                await message.setFlag("pf2e-extraordinary-tales-remastered", "original-rolls", message.rolls);
            
            const newRolls = [];

            for(const roll of message.rolls) {
                const newRoll = roll.clone();
                newRoll.dice.forEach(die => {
                    for(let i = 0; i < die.number; i++) {
                        die.results.push({result: 1, active: true})
                    }
                })

                await newRoll.evaluate();
                newRolls.push(newRoll);
            }

            message.rolls = newRolls;

            await message.update({
                rolls: foundry.utils.duplicate(newRolls)
            })
        }
    })

    // options.push({
    //     name: "Log Data",
    //     condition: true,
    //     callback: $li => {
    //         const message = game.messages.get($li[0].dataset.messageId, { strict: true });
    //         console.log(message);
    //     }
    // });

    options.push({
        name: "Maximum Damage",
        condition: $li => {
            const message = game.messages.get($li[0].dataset.messageId, { strict: true });
            return (message.isOwner || game.user.isGM) && message.isDamageRoll;
        },
        icon: `<i class="fas fa-circle-up"></i>`,
        callback: async $li => {
            const message = game.messages.get($li[0].dataset.messageId, { strict: true });
            if (!message.getFlag("pf2e-extraordinary-tales-remastered", "original-rolls"))
                await message.setFlag("pf2e-extraordinary-tales-remastered", "original-rolls", message.rolls);

            // const DamageRollClass = CONFIG.Dice.rolls.find(i => i.prototype.constructor.name == "DamageRoll");
            // const damageroll = new DamageRollClass("4d8");
            const newRolls = [];

            for(const roll of message.rolls) {
                const newRoll = roll.clone();
                newRoll.dice.forEach(die => {
                    for(let i = 0; i < die.number; i++) {
                        die.results.push({result: die.faces, active: true})
                    }
                })

                await newRoll.evaluate();
                newRolls.push(newRoll);
            }

            message.rolls = newRolls;

            await message.update({
                rolls: foundry.utils.duplicate(newRolls)
            })
        }
    })

    options.push({
        name: "Rolled Damage",
        condition: $li => {
            const message = game.messages.get($li[0].dataset.messageId, { strict: true });
            return (message.isOwner || game.user.isGM) && !!message.getFlag("pf2e-extraordinary-tales-remastered", "original-rolls");
        },
        icon: `<i class="fas fa-rotate-left"></i>`,
        callback: async $li => {
            const message = game.messages.get($li[0].dataset.messageId, { strict: true });
            const rolls = message.getFlag("pf2e-extraordinary-tales-remastered", "original-rolls");
            message.rolls = foundry.utils.duplicate(message.rolls);
            await message.update({
                rolls: foundry.utils.duplicate(rolls)
            })
        }
    })

    options.push({
        name: "Heroic Harmony",
        condition: $li => {
            const message = game.messages.get($li[0].dataset.messageId, { strict: true });
            return (message.isOwner || game.user.isGM) && message.isReroll && (message.flavor ?? "").includes("fa-hospital-symbol");
        },
        icon: `<i class="fas fa-star"></i>`,
        callback: async $li => {
            const message = game.messages.get($li[0].dataset.messageId, { strict: true });
            let d = new Dialog({
                title: "Use Heroic Harmony",
                content: `Activate Heroic Harmony for this reroll?`,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: `Confirm`,
                        callback: async () => {
                            const result = await game.extraordinarytales.activatePersonalXP(actor)
                            if (result) {
                                await game.extraordinarytales.post("Compendium.pf2e-extraordinary-tales-remastered.extraordinary-tales-actions.Item.ZL92qElc3fNO6U7T")
                                game.extraordinarytales.setTerm(message.rolls[0], 2, "heroic")
                            }
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
        }
    })

    // options.push({
    //     name: "Ensure Endeavor",
    //     condition: $li => {
    //         const message = game.messages.get($li[0].dataset.messageId, { strict: true });
    //         if (!message.isReroll) return false;

    //         const html = $(`<div>` + message.content + `</div>`)

    //         const reroll = parseInt(html.find(".reroll-discard .dice-total").text() || 0);
    //         const roll = parseInt(html.find(".dice-total").not(".reroll-discard .dice-total").text() || 0);
    //         console.log(reroll, roll);
    //         return (!message.isOwner || game.user.isGM) && message.isReroll && (message.flavor ?? "").includes("fa-hospital-symbol") && reroll <= roll;
    //     },
    //     icon: `<i class="fas fa-star"></i>`,
    //     callback: async $li => {
    //         const message = game.messages.get($li[0].dataset.messageId, { strict: true });
    //         game.extraordinarytales.promptPersonalXP(game.user.character)
    //     }
    // })

});

Hooks.on('getSceneControlButtons', (controls) => {
    controls.forEach(control => {
        if (control.name == "token") {
            control.tools.push({
                active: false,
                icon: "fa-solid fa-scroll",
                name: "extraordinarytales",
                title: "Extraordinary Tales",
                toggle: false,
                button: true,
                visible: true,
                onClick: () => {
                    game.extraordinarytales.openEditor();
                }
            })
        }
    })
});

Hooks.on("ready", async () => {
    await game.extraordinarytales.createMacros();

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