console.log("Extraordinary Tales | Loaded");

// Rename the roll options to be clearer in adherence to Pathfinder 2e
Hooks.on('renderCheckModifiersDialog', (app, html, data) => {
    html.find(".roll-mode-panel option[value=publicroll]").text("Roll to All");
    html.find(".roll-mode-panel option[value=gmroll]").text("Roll to Self and GM");
    html.find(".roll-mode-panel option[value=selfroll]").text("Test Roll to Self Only");
    html.find(".roll-mode-panel option[value=blindroll]").text("Secret Roll to GM");
})

Hooks.on('renderChatLogPF2e', (app, html, data) => {
    $(".roll-type-select option[value=publicroll]").text("Roll to All");
    $(".roll-type-select option[value=gmroll]").text("Roll to Self and GM");
    $(".roll-type-select option[value=selfroll]").text("Test Roll to Self Only");
    $(".roll-type-select option[value=blindroll]").text("Secret Roll to GM");
});

// Extraordinary Tales Escalation rules
Hooks.on('updateCombat', (a, b, c, d) => {
    if (!game.user.isGM) {
        return;
    }

    let esc = parseInt(game.combat.getFlag('pf2e-extraordinary-tales','escalation') ?? 0);
    for (let c of game.combat.combatants) {
        let t = canvas.tokens.get(c.tokenId);
        let a = t.actor;
        if (a) {
            a.setFlag('pf2e-extraordinary-tales', 'escalation', esc)
        }
    }
})

Hooks.on('renderCombatTracker', (app, html, data) => {

    if (!game.combat) {
        return;
    }

    let esc = parseInt(game.combat.getFlag('pf2e-extraordinary-tales','escalation') ?? 0);

    let appendhtml = $(`<div class="flexrow" style="font-size:85%"><div>Escalation</div><div>${esc}</div><div><button type="button" data-action="escup">+</button></div><div><button type="button" data-action="escdown">-</button></div></div>`);

    appendhtml.on('click','button', (ev) => {
        if (!game.user.isGM) {
            return;
        }

        let act = ev.currentTarget.dataset.action;
        if (act == "escup") {
            game.combat.setFlag('pf2e-extraordinary-tales','escalation', esc + 1)
            ChatMessage.create( {
                content: `<i class="fa-solid fa-star"></i> Escalation (${esc}) <i class="fa-solid fa-arrow-right"></i> (${esc + 1})`
            })
        }
        if (act == "escdown") {
            game.combat.setFlag('pf2e-extraordinary-tales','escalation', esc - 1)
            ChatMessage.create( {
                content: `<i class="fa-solid fa-star"></i> Escalation (${esc}) <i class="fa-solid fa-arrow-right"></i> (${esc - 1})`
            })
        }
    })


    html.find('.encounters').after(appendhtml)
})

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