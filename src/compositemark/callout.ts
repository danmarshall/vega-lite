import {Config} from '../config';
import {Encoding} from '../encoding';
import * as log from '../log';
import {MarkConfig, MarkDef} from '../mark';
import {GenericUnitSpec, LayerSpec} from '../spec';


export const CALLOUT: 'callout' = 'callout';
export type CALLOUT = typeof CALLOUT;

export interface CalloutDef {
  type: CALLOUT;
  calloutAngle?: number;
  calloutOffset?: number;
  calloutLength?: number;
  labelOffset?: number;
  callout?: MarkDef;
  label?: MarkDef;
}

export function isCalloutDef(mark: CALLOUT | CalloutDef): mark is CalloutDef {
  return !!mark['type'];
}

export type CalloutStyle = 'callout-label' | 'callout-rule';

export const CALLOUT_STYLES: CalloutStyle[] = ['callout-label', 'callout-rule'];

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
}

export const VL_ONLY_CALLOUT_CONFIG_PROPERTY_INDEX: {
  [k in keyof CalloutConfigMixins]?: (keyof CalloutConfigMixins[k])[]
} = {
  callout: ['calloutAngle', 'calloutOffset', 'calloutLength', 'labelOffset']
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

  const calloutOffsetCoordinate: {x: number, y: number} = getCoordinateFromAngleAndLength(calloutAngle, calloutOffset);
  const calloutLengthCoordinate: {x: number, y: number} = getCoordinateFromAngleAndLength(calloutAngle, calloutOffset + calloutLength);
  const labelOffsetCoordinate: {x: number, y: number} = getCoordinateFromAngleAndLength(calloutAngle, calloutOffset + calloutLength + labelOffset);

  const {text: textEncoding, ...encodingWithoutText} = encoding;
  if (!textEncoding) {
    // throws warning since it must provide a text
    log.warn('Should have a text encoding in composite mark callout');
    // callout mark should have text encoding

  }

  const returnedSpec: LayerSpec = {
    ...outerSpec,
    layer: [
      { // label
        mark: {
          type: 'text',
          style: 'callout-label',
          xOffset: labelOffsetCoordinate.x,
          yOffset: labelOffsetCoordinate.y
        },
        encoding
      }, { // callout
        mark: {
          type: 'rule',
          style: 'callout-rule',
          xOffset: calloutOffsetCoordinate.x,
          yOffset: calloutOffsetCoordinate.y,
          x2Offset: calloutLengthCoordinate.x,
          y2Offset: calloutLengthCoordinate.y
        },
        encoding: {
          x2: encoding.x,
          y2: encoding.y,
          ...encodingWithoutText
        }
      }
    ]
  };
  return returnedSpec;
}

export function getCoordinateFromAngleAndLength(angle: number, length: number): {x: number, y: number} {
  // tan(angle) = y/x
  // x^2 + y^2 = length^2
  angle = angle % 360;
  const acuteAngle = angle % 90;
  const radians: number = acuteAngle * Math.PI / 180;
  const tangent: number = Math.tan(radians);
  const x: number = Math.sqrt(Math.pow(length, 2) / (1 + Math.pow(tangent, 2)));
  const y: number = x * tangent;
  if (angle === 0) {
    return {x: length, y: 0};
  } else if (angle > 0 && angle < 90) {
    return {x, y: -1 * y};
  } else if (angle === 90) {
    return {x: 0, y: -1 * length};
  } else if (angle > 90 && angle < 180) {
    return {x: -1 * x, y: -1 * y};
  } else if (angle === 180) {
    return {x: -1 * length, y: 0};
  } else if (angle > 180 && angle < 270) {
    return {x: -1 * x, y: -1 * y};
  } else if (angle === 270) {
    return {x: 0, y: length};
  } else {
    return {x, y};
  }
}
