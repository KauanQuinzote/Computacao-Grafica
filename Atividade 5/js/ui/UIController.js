/**
 * UIController - Abstração dos elementos de interface do DOM HTML.
 * Oculta seletores de elementos e atualização de textos da interface.
 */
export class UIController {
    constructor({ onInputChange, onReset, onToggleAnimate }) {
        this.onInputChange = onInputChange;
        this.onReset = onReset;
        this.onToggleAnimate = onToggleAnimate;

        this.controls = {};
        this.initDOM();
    }

    initDOM() {
        const sliderIds = [
            'posX', 'posY', 'rotTorso', 'rotHead',
            'rotShoulderL', 'rotElbowL', 'rotShoulderR', 'rotElbowR',
            'rotLegL', 'rotLegR'
        ];

        sliderIds.forEach(id => {
            const input = document.getElementById(id);
            const valDisplay = document.getElementById('val' + id.charAt(0).toUpperCase() + id.slice(1));
            this.controls[id] = { input, valDisplay };

            if (input) {
                input.addEventListener('input', () => {
                    this.updateDisplays();
                    if (this.onInputChange) {
                        this.onInputChange(this.getValues());
                    }
                });
            }
        });

        // Botão Reset
        const btnReset = document.getElementById('btnReset');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (this.onReset) this.onReset();
            });
        }

        // Botão Animação
        const btnAnimate = document.getElementById('btnAnimate');
        if (btnAnimate) {
            this.btnAnimate = btnAnimate;
            btnAnimate.addEventListener('click', () => {
                if (this.onToggleAnimate) this.onToggleAnimate();
            });
        }
    }

    getValues() {
        const values = {};
        Object.keys(this.controls).forEach(id => {
            values[id] = parseFloat(this.controls[id].input?.value || 0);
        });
        return values;
    }

    setValues(values) {
        Object.keys(values).forEach(id => {
            if (this.controls[id]?.input) {
                this.controls[id].input.value = values[id];
            }
        });
        this.updateDisplays();
    }

    updateDisplays() {
        Object.keys(this.controls).forEach(id => {
            const ctrl = this.controls[id];
            if (ctrl?.input && ctrl?.valDisplay) {
                const unit = id.startsWith('pos') ? 'px' : '°';
                ctrl.valDisplay.textContent = `${ctrl.input.value}${unit}`;
            }
        });
    }

    setAnimateState(isAnimating) {
        if (this.btnAnimate) {
            this.btnAnimate.classList.toggle('active', isAnimating);
            this.btnAnimate.style.borderColor = isAnimating ? '#00e5ff' : '';
        }
    }
}
