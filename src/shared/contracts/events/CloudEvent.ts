/**
 * CloudEvent
 *  CloudEvents v1.0
 * https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
 */

// CloudEvent  -  '1.0'
export type CloudEventSpecVersion = '1.0';

// CloudEvent
export interface CloudEvent<T = any> {
  /**
   * CloudEvent  -
   *  "1.0" -  CloudEvents v1.0
   */
  readonly specversion: CloudEventSpecVersion;

  /**
   *  -
   *
   */
  readonly id: string;

  /**
   *  -
   * , URI-reference
   * @format uri-reference
   *  CloudEvents v1.0 : URI-reference, URI
   * : https://github.com/cloudevents, urn:uuid:..., /cloudevents/spec/pull/123
   */
  readonly source: string;

  /**
   *  -
   * ,
   */
  readonly type: string;

  /**
   *  -
   * RFC3339
   */
  readonly time?: string;

  /**
   *  -
   * ,
   */
  readonly subject?: string;

  /**
   *  -
   * , "application/json"
   */
  readonly datacontenttype?: string;

  /**
   *  -
   * URI
   */
  readonly dataschema?: string;

  /**
   *  -
   *
   */
  readonly data?: T;

  /**
   *  -
   * , CloudEvents
   */
  readonly [key: string]: any;
}

// CloudEvent
export abstract class CloudEventBuilder<T> {
  protected _specversion: CloudEventSpecVersion = '1.0';
  protected _id?: string;
  protected _source?: string;
  protected _type?: string;
  protected _time?: string;
  protected _subject?: string;
  protected _datacontenttype?: string;
  protected _dataschema?: string;
  protected _data?: T;
  protected _extensions: Record<string, any> = {};

  /**
   * ID
   */
  withId(id: string): this {
    this._id = id;
    return this;
  }

  /**
   *
   */
  withSource(source: string): this {
    this._source = source;
    return this;
  }

  /**
   *
   */
  withType(type: string): this {
    this._type = type;
    return this;
  }

  /**
   *
   */
  withTime(time: string | Date): this {
    this._time = time instanceof Date ? time.toISOString() : time;
    return this;
  }

  /**
   *
   */
  withSubject(subject: string): this {
    this._subject = subject;
    return this;
  }

  /**
   *
   */
  withDataContentType(contentType: string): this {
    this._datacontenttype = contentType;
    return this;
  }

  /**
   *
   */
  withDataSchema(schema: string): this {
    this._dataschema = schema;
    return this;
  }

  /**
   *
   */
  withData(data: T): this {
    this._data = data;
    return this;
  }

  /**
   *
   */
  withExtension(key: string, value: any): this {
    //  CloudEvents
    if (!this.isValidExtensionName(key)) {
      throw new Error(`Invalid extension attribute name: ${key}`);
    }
    this._extensions[key] = value;
    return this;
  }

  /**
   *  CloudEvent
   */
  build(): CloudEvent<T> {
    //
    this.validateRequiredFields();

    const event: CloudEvent<T> = {
      specversion: this._specversion,
      id: this._id!,
      source: this._source!,
      type: this._type!,
      ...(this._time && { time: this._time }),
      ...(this._subject && { subject: this._subject }),
      ...(this._datacontenttype && { datacontenttype: this._datacontenttype }),
      ...(this._dataschema && { dataschema: this._dataschema }),
      ...(this._data !== undefined && { data: this._data }),
      ...this._extensions,
    };

    return event;
  }

  /**
   *
   */
  protected validateRequiredFields(): void {
    if (!this._id) throw new Error('CloudEvent id is required');
    if (!this._source) throw new Error('CloudEvent source is required');
    if (!this._type) throw new Error('CloudEvent type is required');
  }

  /**
   *
   */
  protected isValidExtensionName(name: string): boolean {
    // CloudEvents :
    // -
    // - ,
    // - 1-20
    const regex = /^[a-z0-9]([a-z0-9-]{0,18}[a-z0-9])?$/;
    return regex.test(name);
  }
}

//  CloudEvent
export class GenericCloudEventBuilder<T = any> extends CloudEventBuilder<T> {
  static create<T = any>(): GenericCloudEventBuilder<T> {
    return new GenericCloudEventBuilder<T>();
  }

  /**
   *  CloudEvent
   */
  static fromEvent<T>(event: CloudEvent<T>): GenericCloudEventBuilder<T> {
    const builder = new GenericCloudEventBuilder<T>();

    builder._specversion = event.specversion;
    builder._id = event.id;
    builder._source = event.source;
    builder._type = event.type;

    if (event.time) builder._time = event.time;
    if (event.subject) builder._subject = event.subject;
    if (event.datacontenttype) builder._datacontenttype = event.datacontenttype;
    if (event.dataschema) builder._dataschema = event.dataschema;
    if (event.data !== undefined) builder._data = event.data;

    //
    Object.keys(event).forEach(key => {
      if (
        ![
          'specversion',
          'id',
          'source',
          'type',
          'time',
          'subject',
          'datacontenttype',
          'dataschema',
          'data',
        ].includes(key)
      ) {
        builder._extensions[key] = event[key];
      }
    });

    return builder;
  }
}

// CloudEvent
export class CloudEventValidator {
  /**
   *  CloudEvent
   */
  static validate<T>(event: CloudEvent<T>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    //
    if (!event.specversion) {
      errors.push('specversion is required');
    } else if (event.specversion !== '1.0') {
      errors.push(
        `Invalid specversion: ${event.specversion}. CloudEvents v1.0 compliant producers MUST use "1.0"`
      );
    }

    if (!event.id) {
      errors.push('id is required');
    } else if (typeof event.id !== 'string' || event.id.trim().length === 0) {
      errors.push('id must be a non-empty string');
    }

    if (!event.source) {
      errors.push('source is required');
    } else if (
      typeof event.source !== 'string' ||
      event.source.trim().length === 0
    ) {
      errors.push('source must be a non-empty string');
    } else if (!this.isValidURIReference(event.source)) {
      errors.push(
        'source must be a valid URI-reference according to CloudEvents v1.0 specification'
      );
    }

    if (!event.type) {
      errors.push('type is required');
    } else if (
      typeof event.type !== 'string' ||
      event.type.trim().length === 0
    ) {
      errors.push('type must be a non-empty string');
    }

    //
    if (event.time) {
      if (!this.isValidRFC3339Timestamp(event.time)) {
        errors.push('time must be a valid RFC3339 timestamp');
      }
    }

    if (event.datacontenttype) {
      if (!this.isValidMediaType(event.datacontenttype)) {
        errors.push('datacontenttype must be a valid media type');
      }
    }

    if (event.dataschema) {
      if (!this.isValidURI(event.dataschema)) {
        errors.push('dataschema must be a valid URI');
      }
    }

    //
    Object.keys(event).forEach(key => {
      if (!this.isReservedAttribute(key) && !this.isValidExtensionName(key)) {
        errors.push(`Invalid extension attribute name: ${key}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   *  RFC3339
   */
  private static isValidRFC3339Timestamp(timestamp: string): boolean {
    try {
      const date = new Date(timestamp);
      return !isNaN(date.getTime()) && timestamp === date.toISOString();
    } catch {
      return false;
    }
  }

  /**
   *
   */
  private static isValidMediaType(mediaType: string): boolean {
    //
    const regex =
      /^[a-zA-Z][a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*$/;
    return regex.test(mediaType);
  }

  /**
   *  URI
   */
  private static isValidURI(uri: string): boolean {
    try {
      new URL(uri);
      return true;
    } catch {
      //  URI, URI
      return uri.trim().length > 0;
    }
  }

  /**
   *  URI-reference (CloudEvents v1.0 )
   * URI-reference  URI  URI
   */
  private static isValidURIReference(uriRef: string): boolean {
    if (!uriRef || uriRef.trim().length === 0) {
      return false;
    }

    const trimmed = uriRef.trim();

    try {
      //  URI
      new URL(trimmed);
      return true;
    } catch {
      //  URI, URI-reference
      // URI-reference ,
      // ,
      if (/[\s\n\r\t]/.test(trimmed)) {
        return false;
      }

      //  URI
      //  ( /path, path/to/resource)
      //  URN  ( urn:uuid:...)
      return trimmed.length > 0 && !trimmed.includes(' ');
    }
  }

  /**
   *
   */
  private static isReservedAttribute(name: string): boolean {
    const reserved = [
      'specversion',
      'id',
      'source',
      'type',
      'time',
      'subject',
      'datacontenttype',
      'dataschema',
      'data',
    ];
    return reserved.includes(name);
  }

  /**
   *
   */
  private static isValidExtensionName(name: string): boolean {
    const regex = /^[a-z0-9]([a-z0-9-]{0,18}[a-z0-9])?$/;
    return regex.test(name);
  }
}

//
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

// CloudEvent
export class CloudEventUtils {
  /**
   *  ID
   */
  static generateId(prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return prefix
      ? `${prefix}-${timestamp}-${random}`
      : `${timestamp}-${random}`;
  }

  /**
   *  RFC3339
   */
  static getCurrentTime(): string {
    return new Date().toISOString();
  }

  /**
   *  CloudEvent
   */
  static clone<T>(event: CloudEvent<T>): CloudEvent<T> {
    return JSON.parse(JSON.stringify(event));
  }

  /**
   *  CloudEvent
   */
  static equals<T>(event1: CloudEvent<T>, event2: CloudEvent<T>): boolean {
    return JSON.stringify(event1) === JSON.stringify(event2);
  }

  /**
   * ()
   */
  static extractMetadata<T>(event: CloudEvent<T>): Omit<CloudEvent<T>, 'data'> {
    const { data, ...metadata } = event;
    return metadata;
  }

  /**
   *  CloudEvent  JSON
   */
  static toJSON<T>(event: CloudEvent<T>): string {
    return JSON.stringify(event, null, 2);
  }

  /**
   *  JSON  CloudEvent
   */
  static fromJSON<T>(json: string): CloudEvent<T> {
    try {
      const event = JSON.parse(json) as CloudEvent<T>;
      const validationResult = CloudEventValidator.validate(event);

      if (!validationResult.isValid) {
        throw new Error(
          `Invalid CloudEvent: ${validationResult.errors.join(', ')}`
        );
      }

      return event;
    } catch (error) {
      throw new Error(`Failed to parse CloudEvent from JSON: ${error}`);
    }
  }
}
