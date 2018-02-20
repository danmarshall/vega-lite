import {Encoding} from '../encoding';
import {MarkConfig, MarkDef} from '../mark';
import {GenericUnitSpec, LayerSpec} from '../spec';


export const CALLOUT: 'callout' = 'callout';
export type CALLOUT = typeof CALLOUT;

export interface CalloutDef {
  type: CALLOUT;
  calloutOffset: {x: number, y: number};
  calloutSize: {x: number, y: number};
  callout: MarkDef;
  labelOffset:{x: number, y: number};
  label: MarkDef;
}

export function isCalloutDef(mark: CALLOUT | CalloutDef): mark is CalloutDef {
  return !!mark['type'];
}

export interface CalloutConfig extends MarkConfig {
  calloutOffset: {x: number, y: number};
  calloutSize: {x: number, y: number};
  labelOffset:{x: number, y: number};
}

export function normalizeCallout(spec: GenericUnitSpec<Encoding<string>, CALLOUT>): LayerSpec {
  const {mark: mark, selection: _sel, projection: _p, encoding, ...outerSpec} = spec;
  let calloutOffset: {x: number, y: number} = undefined;
  let calloutSize: {x: number, y: number} = undefined;
  let labelOffset: {x: number, y: number} = undefined;

  const defaultOffset = {x: 0, y: 0};
  if (isCalloutDef(mark)) {
    calloutOffset = mark.calloutOffset ? mark.calloutOffset : defaultOffset;
    calloutSize = mark.calloutSize ? mark.calloutSize : defaultOffset;
    labelOffset = mark.labelOffset ? mark.labelOffset : defaultOffset;
  }
  const {text: textEncoding, ...encodingWithoutText} = encoding;
  if (!textEncoding) {
    // throw error since it must provides an text
    throw new Error('Must have a text encoding in composite mark callout');
  }
  const returnedSpec: LayerSpec = {
    ...outerSpec,
    layer: [
      { // label
        mark: {
          type: 'text',
          xOffset: labelOffset.x + calloutSize.x + calloutOffset.x,
          yOffset: labelOffset.y + calloutSize.y + calloutOffset.y
        },
        encoding
      }, { // callout
        mark: {
          type: 'rule',
          xOffset: calloutOffset.x,
          yOffset: calloutOffset.y,
          x2Offset: calloutSize.x,
          y2Offset: calloutSize.y
        },
        encoding: {
          x: encoding.x,
          y: encoding.y,
          x2: encoding.x,
          y2: encoding.y,
          ...encodingWithoutText
        }
      }
    ]
  };
  return returnedSpec;
}
