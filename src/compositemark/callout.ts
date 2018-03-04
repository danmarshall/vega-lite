import {Config} from '../config';
import {Encoding} from '../encoding';
import * as log from '../log';
import {MarkConfig} from '../mark';
import {GenericUnitSpec, LayerSpec} from '../spec';

export const CALLOUT: 'callout' = 'callout';
export type CALLOUT = typeof CALLOUT;

export interface CalloutDef extends CalloutConfig {
  type: CALLOUT;
  callout?: MarkConfig;
  label?: MarkConfig;
}

export function isCalloutDef(mark: CALLOUT | CalloutDef): mark is CalloutDef {
  return !!mark['type'];
}

export type CalloutStyle = 'calloutLabel' | 'calloutRule';

export const CALLOUT_STYLES: CalloutStyle[] = ['calloutLabel', 'calloutRule'];

export interface CalloutConfig extends MarkConfig {
  calloutAngle?: number;
  calloutOffset?: number;
  calloutLength?: number;
  labelOffset?: number;
}

export interface CalloutConfigMixins {
  /**
   * Callout Rule Config
   * @hide
   */
  callout?: CalloutConfig;
  calloutLabel?: MarkConfig;
  calloutRule?: MarkConfig;
}

export const VL_ONLY_CALLOUT_CONFIG_PROPERTY_INDEX: {
  [k in keyof CalloutConfigMixins]?: (keyof CalloutConfigMixins[k])[]
} = {
  callout: ['calloutAngle', 'calloutOffset', 'calloutLength', 'labelOffset'],
  calloutLabel: ['color'],
  calloutRule: ['color']
};

export function normalizeCallout(spec: GenericUnitSpec<Encoding<string>, CALLOUT>, config: Config): LayerSpec {
  // TODO:  determine what's the general rule for applying selection for composite marks
  const {mark: mark, selection: _sel, projection: _p, encoding, ...outerSpec} = spec;
  if (!isCalloutDef(mark)) {
    return null;
  }

  const calloutAngle: number = mark.calloutAngle ? mark.calloutAngle : config.callout.calloutAngle;
  const calloutOffset: number = mark.calloutOffset ? mark.calloutOffset : config.callout.calloutOffset;
  const calloutLength: number = mark.calloutLength ? mark.calloutLength : config.callout.calloutLength;
  const labelOffset: number = mark.labelOffset ? mark.labelOffset : config.callout.labelOffset;

  const calloutOffsetCoor1: {x: number, y: number} = getCoordinateFromAngleAndLength(calloutAngle, calloutOffset);
  const calloutOffsetCoor2: {x: number, y: number} = getCoordinateFromAngleAndLength(calloutAngle, calloutOffset + calloutLength);
  const labelTotalOffsetCoor: {x: number, y: number} = getCoordinateFromAngleAndLength(calloutAngle, calloutOffset + calloutLength + labelOffset);

  const {text: textEncoding, size: sizeEncoding, ...encodingWithoutTextAndSize} = encoding;
  if (!textEncoding) {
    log.warn('callout mark should have text encoding');
  }

  const returnedSpec: LayerSpec = {
    ...outerSpec,
    layer: [
      { // label
        mark: {
          type: 'text',
          style: 'calloutLabel',
          xOffset: labelTotalOffsetCoor.x,
          yOffset: labelTotalOffsetCoor.y
        },
        encoding
      }, { // callout
        mark: {
          type: 'rule',
          style: 'calloutRule',
          xOffset: calloutOffsetCoor1.x,
          yOffset: calloutOffsetCoor1.y,
          x2Offset: calloutOffsetCoor2.x,
          y2Offset: calloutOffsetCoor2.y
        },
        encoding: {
          x2: encoding.x,
          y2: encoding.y,
          ...encodingWithoutTextAndSize
        }
      }
    ]
  };
  return returnedSpec;
}

function getCoordinateFromAngleAndLength(angle: number, length: number): {x: number, y: number} {
  const radian = angle * Math.PI / 180;
  return {x: length * Math.cos(radian), y: -1 * length * Math.sin(radian)};
}
