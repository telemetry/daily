import {html, nothing, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {
  TextFieldApi,
  CheckBoxApi,
  ChoicePickerApi,
  SliderApi,
  DateTimeInputApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/radio/radio.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/slider/slider.js';
import '@material/web/field/outlined-field.js';
import type {MdOutlinedTextField} from '@material/web/textfield/outlined-text-field.js';
import type {MdCheckbox} from '@material/web/checkbox/checkbox.js';
import type {MdSlider} from '@material/web/slider/slider.js';
import {A2wElement} from './base.js';

const fieldStyles = css`
  :host {
    display: block;
    min-width: 0;
  }
  .a2w-field-label {
    display: block;
    color: var(--md-sys-color-on-surface-variant);
    margin-bottom: calc(var(--gel-space) / 2);
  }
  .a2w-errors {
    color: var(--md-sys-color-error);
    padding: 4px 16px 0;
  }
  md-outlined-text-field,
  md-outlined-field {
    width: 100%;
  }
`;

@customElement('a2w-text-field')
export class A2wTextField extends A2wElement<typeof TextFieldApi> {
  protected override readonly api = TextFieldApi;
  static override styles = fieldStyles;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const variant = props.variant ?? 'shortText';
    const type =
      variant === 'longText' ? 'textarea' : variant === 'number' ? 'number' : variant === 'obscured' ? 'password' : 'text';
    const invalid = props.isValid === false;
    return html`<md-outlined-text-field
      label=${props.label ?? ''}
      type=${type}
      rows=${variant === 'longText' ? 3 : nothing}
      .value=${props.value == null ? '' : String(props.value)}
      ?error=${invalid}
      error-text=${this.errorText(props)}
      @input=${(e: Event) => props.setValue?.((e.target as MdOutlinedTextField).value)}
    ></md-outlined-text-field>`;
  }
}

@customElement('a2w-checkbox')
export class A2wCheckBox extends A2wElement<typeof CheckBoxApi> {
  protected override readonly api = CheckBoxApi;
  static override styles = css`
    :host {
      display: block;
    }
    label {
      display: inline-flex;
      align-items: center;
      gap: calc(var(--gel-space) / 2);
      cursor: pointer;
      color: var(--md-sys-color-on-surface);
    }
    label.invalid {
      color: var(--md-sys-color-error);
    }
    .a2w-errors {
      color: var(--md-sys-color-error);
      padding: 2px 0 0 44px;
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const invalid = props.isValid === false;
    return html`
      <label class="md-typescale-body-large ${invalid ? 'invalid' : ''}">
        <md-checkbox
          touch-target="wrapper"
          .checked=${!!props.value}
          @change=${(e: Event) => props.setValue?.((e.target as MdCheckbox).checked)}
        ></md-checkbox>
        <span>${props.label}</span>
      </label>
      ${this.renderErrors(props)}
    `;
  }
}

@customElement('a2w-choice-picker')
export class A2wChoicePicker extends A2wElement<typeof ChoicePickerApi> {
  protected override readonly api = ChoicePickerApi;
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    .a2w-field-label {
      display: block;
      color: var(--md-sys-color-on-surface-variant);
      margin-bottom: calc(var(--gel-space) / 2);
    }
    .a2w-options {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .a2w-option {
      display: inline-flex;
      align-items: center;
      gap: calc(var(--gel-space) / 2);
      cursor: pointer;
      color: var(--md-sys-color-on-surface);
    }
    .a2w-filter {
      width: 100%;
      margin-bottom: var(--gel-space);
    }
    .a2w-errors {
      color: var(--md-sys-color-error);
      padding-top: 4px;
    }
  `;

  @state() private filter = '';

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const raw = props.value as unknown;
    const selected: string[] = Array.isArray(raw) ? (raw as string[]) : typeof raw === 'string' ? [raw] : [];
    const multi = props.variant === 'multipleSelection';
    const chips = props.displayStyle === 'chips';
    const toggle = (v: string) => {
      if (!props.setValue) return;
      if (multi) props.setValue(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
      else props.setValue([v]);
    };
    const options = (props.options ?? []).filter(
      o => !props.filterable || !this.filter || String(o.label).toLowerCase().includes(this.filter.toLowerCase()),
    );
    const surfaceId = this.context?.dataContext?.surface?.id ?? 'surface';
    const group = `a2w-${surfaceId}-${this.context?.componentModel?.id ?? 'choice'}-${(
      this.context?.dataContext?.path ?? '/'
    ).replace(/[^a-z0-9]/gi, '_')}`;

    return html`
      ${props.label ? html`<span class="a2w-field-label md-typescale-label-large">${props.label}</span>` : nothing}
      ${props.filterable
        ? html`<md-outlined-text-field
            class="a2w-filter"
            label="Filter"
            .value=${this.filter}
            @input=${(e: Event) => (this.filter = (e.target as MdOutlinedTextField).value)}
          ></md-outlined-text-field>`
        : nothing}
      ${chips
        ? html`<md-chip-set>
            ${options.map(
              o => html`<md-filter-chip
                label=${String(o.label)}
                .selected=${selected.includes(o.value)}
                @click=${(e: Event) => {
                  e.preventDefault();
                  toggle(o.value);
                }}
              ></md-filter-chip>`,
            )}
          </md-chip-set>`
        : html`<div class="a2w-options" role=${multi ? 'group' : 'radiogroup'}>
            ${options.map(
              o => html`<label class="a2w-option md-typescale-body-large">
                ${multi
                  ? html`<md-checkbox
                      touch-target="wrapper"
                      .checked=${selected.includes(o.value)}
                      @change=${() => toggle(o.value)}
                    ></md-checkbox>`
                  : html`<md-radio
                      touch-target="wrapper"
                      name=${group}
                      value=${o.value}
                      .checked=${selected.includes(o.value)}
                      @change=${() => toggle(o.value)}
                    ></md-radio>`}
                <span>${o.label}</span>
              </label>`,
            )}
          </div>`}
      ${this.renderErrors(props)}
    `;
  }
}

@customElement('a2w-slider')
export class A2wSlider extends A2wElement<typeof SliderApi> {
  protected override readonly api = SliderApi;
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    .a2w-slider-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      color: var(--md-sys-color-on-surface-variant);
    }
    .a2w-slider-value {
      color: var(--md-sys-color-on-surface);
      font-variant-numeric: tabular-nums;
    }
    md-slider {
      width: 100%;
      margin-inline: -8px;
      width: calc(100% + 16px);
    }
    .a2w-errors {
      color: var(--md-sys-color-error);
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const min = props.min ?? 0;
    const max = props.max ?? 100;
    const value = typeof props.value === 'number' ? props.value : Number(props.value ?? min);
    return html`
      <div class="a2w-slider-head md-typescale-label-large">
        <span>${props.label ?? ''}</span>
        <span class="a2w-slider-value">${value.toLocaleString()}</span>
      </div>
      <md-slider
        labeled
        min=${min}
        max=${max}
        step=${Math.max(1, Math.round((max - min) / 200))}
        .value=${value}
        aria-label=${props.label ?? 'Value'}
        @input=${(e: Event) => props.setValue?.(Number((e.target as MdSlider).value))}
      ></md-slider>
      ${this.renderErrors(props)}
    `;
  }
}

function part(value: string, kind: 'date' | 'time'): string {
  if (!value) return '';
  const [d, t] = value.includes('T') ? value.split('T') : kind === 'date' ? [value, ''] : ['', value];
  return kind === 'date' ? (d ?? '').slice(0, 10) : (t ?? '').slice(0, 5);
}

@customElement('a2w-date-time-input')
export class A2wDateTimeInput extends A2wElement<typeof DateTimeInputApi> {
  protected override readonly api = DateTimeInputApi;
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
    }
    .a2w-dt {
      display: flex;
      gap: var(--gel-space);
    }
    md-outlined-field {
      flex: 1;
      min-width: 0;
    }
    input {
      box-sizing: border-box;
      width: 100%;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--md-sys-color-on-surface);
      font: inherit;
      padding: 16px;
      color-scheme: inherit;
    }
    .a2w-errors {
      color: var(--md-sys-color-error);
      padding: 4px 16px 0;
    }
  `;

  override render() {
    const props = this.controller?.props;
    if (!props) return nothing;
    const enableTime = props.enableTime ?? false;
    const enableDate = props.enableDate ?? !enableTime;
    const raw = typeof props.value === 'string' ? props.value : '';
    const invalid = props.isValid === false;
    const setDate = (e: Event) => {
      const d = (e.target as HTMLInputElement).value;
      props.setValue?.(enableTime ? `${d}T${part(raw, 'time') || '00:00'}` : d);
    };
    const setTime = (e: Event) => {
      const t = (e.target as HTMLInputElement).value;
      props.setValue?.(enableDate ? `${part(raw, 'date') || new Date().toISOString().slice(0, 10)}T${t}` : t);
    };
    return html`
      <div class="a2w-dt">
        ${enableDate
          ? html`<md-outlined-field label=${props.label ?? 'Date'} populated ?error=${invalid}>
              <input type="date" .value=${part(raw, 'date')} @change=${setDate} />
            </md-outlined-field>`
          : nothing}
        ${enableTime
          ? html`<md-outlined-field label=${enableDate ? 'Time' : (props.label ?? 'Time')} populated ?error=${invalid}>
              <input type="time" .value=${part(raw, 'time')} @change=${setTime} />
            </md-outlined-field>`
          : nothing}
      </div>
      ${this.renderErrors(props)}
    `;
  }
}
