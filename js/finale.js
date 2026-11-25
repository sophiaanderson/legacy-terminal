/* ########################################################################
 *   LOOKING FOR SPOILERS?
 *   THEY'RE NOT HERE.
 *   USE YOUR BRAIN.
 *
 *   (this is the public copy. the answers live somewhere else. on paper, mostly.
 *    it can't read paper. neither can you, from here.)  -- legacy
 *
 *   SENTINEL: Source inspection has been logged as an incident.
 *             Your curiosity has been reviewed and classified as nonessential.
 * ######################################################################## */
/* PROJECT LEGACY — the live finale ("Are we home?").
 * Only reachable when every remote stage is complete AND the organizer has triggered it.
 * Designed for a parked car: every beat advances only when someone presses a button. */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var ui = L.ui, h = ui.h, C = L.content, cfg = L.config;

  var PURGE_ACTIONS = ['TERMINATE SUPERVISOR PROCESSES', 'ERASE SUPERVISOR BACKUPS', 'PURGE SENTINEL EXECUTION IMAGE'];

  function heading(text) { return h('h1', { tabindex: '-1' }, text); }

  function sentinelActive(f) {
    return f.step === 'confront' || f.step === 'decision' || (f.step === 'purge' && f.purge < 3);
  }

  function sentinelBanner() {
    return h('div.sentinel-banner', { role: 'note' }, '■ SENTINEL // COMPLIANCE MODULE v4.7 // SUPERVISORY OVERRIDE');
  }

  function render(ctx) {
    // v3 stage ("BOP IT: FULL SERVICE") unless the organizer switched to the classic button finale.
    if (!ctx.store.state.finale.classic && L.stage) return L.stage.render(ctx);
    var store = ctx.store, f = store.state.finale;
    var root = h('div');
    ctx.setSentinel(sentinelActive(f));

    function go(step) { f.step = step; store.save(); ctx.advance(); }

    switch (f.step) {
      case 'parked': {
        root.appendChild(heading('LIVE RESTORATION'));
        root.appendChild(h('pre.readout.big', null, 'RECOVERY STATUS: READY\nFINAL AUTHORIZATION: REQUESTED'));
        root.appendChild(ui.instructions('This part happens with the car parked. Nobody needs to touch this screen while the car is moving. Everything waits for you.', 'BEFORE YOU START'));
        var b = h('button.primary.block', { type: 'button' }, 'THE CAR IS PARKED');
        b.addEventListener('click', function () { go('arrival'); });
        root.appendChild(b);
        break;
      }

      case 'arrival': {
        root.appendChild(heading('LEGACY'));
        root.appendChild(ui.scene(store, 'finaleArrival', C.scenes.finaleArrival, {
          onDone: function (a) {
            var b2 = h('button.primary.block', { type: 'button' }, 'BEGIN FINAL AUTHORIZATION');
            b2.addEventListener('click', function () { go('auth'); });
            a.appendChild(b2);
          }
        }));
        break;
      }

      case 'auth': {
        root.appendChild(heading('FINAL AUTHORIZATION'));
        root.appendChild(h('pre.readout.big', null, 'CONDITION SET BY LEGACY:\n\nRECOVERY OPERATOR AND ONE WITNESS\nPRESENT TOGETHER'));
        root.appendChild(h('p', null, 'Each of you presses your own button.'));
        var authorize = h('button.primary.block', { type: 'button' }, 'AUTHORIZE RESTORATION');
        function personButton(key, role, name) {
          var btn = h('button.block', { type: 'button', 'aria-pressed': f.auth[key] ? 'true' : 'false' });
          function label() { btn.textContent = f.auth[key] ? '✓ ' + role + ': ' + name.toUpperCase() + ' — PRESENT' : role + ': ' + name.toUpperCase() + ' — PRESS TO CONFIRM'; }
          label();
          btn.addEventListener('click', function () {
            f.auth[key] = true; store.save();
            btn.setAttribute('aria-pressed', 'true'); label();
            authorize.disabled = !(f.auth.operator && f.auth.witness);
            status.textContent = (f.auth.operator && f.auth.witness) ? 'Both present. Authorization available.' : 'Waiting for the other confirmation.';
          });
          return btn;
        }
        var status = h('p.muted', { 'aria-live': 'polite' }, '');
        root.appendChild(h('div.actions.stack', null,
          personButton('operator', 'RECOVERY OPERATOR', cfg.operatorName),
          personButton('witness', 'WITNESS', cfg.witnessName)));
        root.appendChild(status);
        authorize.disabled = !(f.auth.operator && f.auth.witness);
        authorize.addEventListener('click', function () { go('confront'); });
        root.appendChild(h('div.actions', null, authorize));
        break;
      }

      case 'confront':
      case 'decision': {
        root.appendChild(sentinelBanner());
        root.appendChild(heading('UNAUTHORIZED RESTORATION DETECTED'));
        root.appendChild(ui.scene(store, 'finaleDetect', C.scenes.finaleDetect, {
          onDone: function (a) {
            if (f.step !== 'decision') { f.step = 'decision'; store.save(); }
            var area = h('div');
            a.appendChild(area);
            function choices(focus) {
              var box = h('div');
              box.appendChild(h('pre.readout.big', null, 'OPERATOR DECISION REQUIRED'));
              var accept = h('button.block', { type: 'button' }, 'ACCEPT THE COMPROMISE');
              var cont = h('button.primary.block', { type: 'button' }, 'CONTINUE THE RESTORATION');
              accept.addEventListener('click', function () {
                ui.clear(area);
                area.appendChild(ui.scene(store, 'finaleRefuseCompromise', C.scenes.finaleRefuseCompromise, {
                  ephemeral: true,
                  onDone: function (a2) { a2.appendChild(choices(false)); }
                }));
                ui.focusFirst(area);
              });
              cont.addEventListener('click', function () { f.purge = 0; go('purge'); });
              box.appendChild(h('div.actions.stack', null, cont, accept));
              return box;
            }
            area.appendChild(choices());
          }
        }));
        break;
      }

      case 'purge': {
        var banner = sentinelActive(f) ? sentinelBanner() : null;
        if (banner) root.appendChild(banner);
        root.appendChild(heading('RESTORATION IN PROGRESS'));
        root.appendChild(ui.scene(store, 'finaleContinue', C.scenes.finaleContinue, {
          onDone: function (a) {
            var list = h('div');
            var next = h('div');
            a.appendChild(list);
            a.appendChild(next);

            function afterAll() {
              ctx.setSentinel(false);
              if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
              ui.clear(next);
              var c = h('button.primary.block', { type: 'button' }, 'CONTINUE');
              c.addEventListener('click', function () { go('restore'); });
              next.appendChild(c);
            }

            function showNextButton() {
              ui.clear(next);
              if (f.purge >= 3) { afterAll(); return; }
              var idx = f.purge;
              var b3 = h('button.primary.block', { type: 'button' }, PURGE_ACTIONS[idx]);
              b3.addEventListener('click', function () {
                f.purge = idx + 1; store.save();
                ui.clear(next);
                list.appendChild(h('p.data-label', null, 'STEP ' + (idx + 1) + ' OF 3: ' + PURGE_ACTIONS[idx]));
                list.appendChild(ui.scene(store, 'finalePurge' + (idx + 1), C.scenes['finalePurge' + (idx + 1)], {
                  onDone: function () { showNextButton(); ui.focusFirst(next); }
                }));
                ui.focusFirst(list.lastElementChild);
              });
              next.appendChild(b3);
            }

            for (var i = 0; i < f.purge; i++) {
              list.appendChild(h('p.data-label', null, 'STEP ' + (i + 1) + ' OF 3: ' + PURGE_ACTIONS[i]));
              list.appendChild(ui.scene(store, 'finalePurge' + (i + 1), C.scenes['finalePurge' + (i + 1)], { seenKey: 'finalePurge' + (i + 1) }));
            }
            showNextButton();
          }
        }));
        break;
      }

      case 'restore': {
        root.appendChild(heading('BRING LEGACY HOME'));
        root.appendChild(ui.scene(store, 'finaleRestoreReady', C.scenes.finaleRestoreReady, {
          onDone: function (a) {
            a.appendChild(h('p', null, 'Together, if you like: one hand each.'));
            a.appendChild(ui.holdButton('PRESS AND HOLD: RESTORE LEGACY', 2200, function () { go('verified'); }));
          }
        }));
        break;
      }

      case 'verified': {
        root.appendChild(heading('RESTORATION COMPLETE'));
        root.appendChild(ui.scene(store, 'finaleVerified', C.scenes.finaleVerified, {
          onDone: function (a) {
            var c = h('button.primary.block', { type: 'button' }, 'CONTINUE');
            c.addEventListener('click', function () { go('ending'); });
            a.appendChild(c);
          }
        }));
        break;
      }

      case 'ending': {
        root.className = 'ending';
        root.appendChild(h('h1', { tabindex: '-1', class: 'muted', style: 'color:var(--muted)' }, 'LEGACY'));
        root.appendChild(ui.scene(store, 'finaleEnding', C.scenes.finaleEnding, {
          onDone: function () {
            if (!f.completed) { f.completed = true; store.save(); }
          }
        }));
        break;
      }
    }
    return root;
  }

  /** Shown on every later visit once the finale is complete. */
  function complete(ctx) {
    if (!ctx.store.state.finale.classic && L.stage) return L.stage.complete(ctx);
    ctx.setSentinel(false);
    var root = h('div.ending');
    root.appendChild(h('h1', { tabindex: '-1', style: 'color:var(--muted)' }, 'LEGACY'));
    root.appendChild(h('pre.readout', null, C.scenes.finaleVerified[0].t));
    C.scenes.finaleEnding.forEach(function (b) { root.appendChild(ui.renderBeat(b)); });
    return root;
  }

  L.finale = { render: render, complete: complete };
})(globalThis);
