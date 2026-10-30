/**
 * The Westpac catalog: the A2UI basic catalog's component APIs, implemented
 * with Material Web components wearing GEL tokens.
 *
 * It is registered under the basic catalog's own id, so any agent that speaks
 * the standard basic catalog renders here unchanged. That is the whole point of
 * the experiment: the agent's output never mentions a brand.
 */
import {Catalog} from '@a2ui/web_core/v0_9';
import {createBasicCatalogFunctions, basicCatalog} from '@a2ui/web_core/v0_9/basic_catalog';
import type {WebComponentImplementation} from '@a2ui/web_core/v0_9/universal';
import {
  TextApi,
  ImageApi,
  IconApi,
  RowApi,
  ColumnApi,
  ListApi,
  CardApi,
  TabsApi,
  ModalApi,
  DividerApi,
  ButtonApi,
  TextFieldApi,
  CheckBoxApi,
  ChoicePickerApi,
  SliderApi,
  DateTimeInputApi,
  A2uiVideo,
  A2uiAudioPlayer,
} from '@a2ui/web_core/v0_9/basic_catalog';

import {A2wText} from './text.js';
import {A2wImage} from './image.js';
import {A2wIcon} from './icon.js';
import {A2wRow, A2wColumn, A2wList} from './layout.js';
import {A2wCard, A2wDivider} from './card.js';
import {A2wTabs, A2wModal} from './tabs.js';
import {A2wButton} from './button.js';
import {A2wTextField, A2wCheckBox, A2wChoicePicker, A2wSlider, A2wDateTimeInput} from './inputs.js';

const impl = <A extends {name: string; schema: any}>(
  api: A,
  tagName: string,
  element: CustomElementConstructor,
): WebComponentImplementation<A['schema']> => ({...api, tagName, element});

export const WESTPAC_COMPONENTS = [
  impl(TextApi, 'a2w-text', A2wText),
  impl(ImageApi, 'a2w-image', A2wImage),
  impl(IconApi, 'a2w-icon', A2wIcon),
  impl(RowApi, 'a2w-row', A2wRow),
  impl(ColumnApi, 'a2w-column', A2wColumn),
  impl(ListApi, 'a2w-list', A2wList),
  impl(CardApi, 'a2w-card', A2wCard),
  impl(TabsApi, 'a2w-tabs', A2wTabs),
  impl(ModalApi, 'a2w-modal', A2wModal),
  impl(DividerApi, 'a2w-divider', A2wDivider),
  impl(ButtonApi, 'a2w-button', A2wButton),
  impl(TextFieldApi, 'a2w-text-field', A2wTextField),
  impl(CheckBoxApi, 'a2w-checkbox', A2wCheckBox),
  impl(ChoicePickerApi, 'a2w-choice-picker', A2wChoicePicker),
  impl(SliderApi, 'a2w-slider', A2wSlider),
  impl(DateTimeInputApi, 'a2w-date-time-input', A2wDateTimeInput),
  // Media components fall through to the reference implementations.
  A2uiVideo,
  A2uiAudioPlayer,
];

/** Same id as the basic catalog: the stream is renderer-agnostic by construction. */
export const westpacCatalog = new Catalog<WebComponentImplementation>(
  basicCatalog.id,
  '0.9',
  WESTPAC_COMPONENTS,
  // An Australian bank formats money for Australians: formatCurrency says $, not A$.
  createBasicCatalogFunctions({locale: 'en-AU'}),
  basicCatalog.themeSchema,
);

export {basicCatalog as referenceCatalog};
