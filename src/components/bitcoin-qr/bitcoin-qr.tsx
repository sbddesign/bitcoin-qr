import { Component, Element, Prop, State, Watch, h } from '@stencil/core';
import QRCodeStyling, { Options } from 'qr-code-styling';

@Component({
  tag: 'bitcoin-qr',
  shadow: true,
})
export class BitcoinQR {
  @Element() bitcoinQR: HTMLElement;

  // [BIP-21](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki) format,
  // overrides `bitcoin`, `lightning`, and `parameters` props
  @Prop() unified?: string;
  @Prop() bitcoin?: string;
  @Prop() lightning?: string;
  @Prop() parameters?: string;
  @Prop() callback?: () => void;
  @Prop() isPolling?: boolean;
  @Prop({ mutable: true }) pollInterval?: number;
  @Prop() imageEmbedded?: boolean; // Whether to embed or overlay the image, may require Error Correction Level experimentation
  @Prop() debug?: boolean;
  
  // Click behavior configuration
  @Prop({ attribute: 'click-behavior' }) clickBehavior?: 'url' | 'copy' | 'none';

  // QR code styling options
  @Prop() width?: number;
  @Prop() height?: number;
  @Prop() type?: 'canvas' | 'svg'; // DrawType
  @Prop() margin?: number;
  @Prop() image?: string;
  @Prop() shape?: 'square' | 'circle'; // ShapeType
  @Prop() qrTypeNumber?: number; // QrTypeNumber
  @Prop() qrMode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji'; // Mode
  @Prop() qrErrorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // ErrorCorrectionLevel
  // Image options
  @Prop() imageHideBackgroundDots?: boolean;
  @Prop() imageSize?: number;
  @Prop() imageCrossOrigin?: string;
  @Prop() imageMargin?: number;
  // Dots options
  @Prop() dotsType?: 'square' | 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'extra-rounded';
  @Prop() dotsColor?: string;
  @Prop() dotsRotation?: number;
  // TODO: gradient options
  // @Prop() dotsGradient?: Gradient;
  // Corners square options
  @Prop() cornersSquareType?: 'square' | 'extra-rounded' | 'dot'; // CornerSquareType
  @Prop() cornersSquareColor?: string;
  // @Prop() cornersSquareGradient?: Gradient;
  // Corners dot options
  @Prop() cornersDotType?: 'square' | 'dot'; // CornerDotType
  @Prop() cornersDotColor?: string;
  // @Prop() cornersDotGradient?: Gradient;
  // Background options
  @Prop() backgroundRound?: number;
  @Prop() backgroundColor?: string;
  // @Prop() backgroundGradient?: Gradient;

  @State() qr: QRCodeStyling;

  get copyContent() {
    // For BIP-21 unified QR: include the full URL protocol
    if (this.unified) {
      return this.uri;
    }
    
    // For lightning invoice only: just the invoice string
    if (this.lightning && !this.bitcoin) {
      return this.lightning;
    }
    
    // For bitcoin on-chain only: just the address string
    if (this.bitcoin && !this.lightning) {
      return this.bitcoin;
    }
    
    // For mixed bitcoin + lightning (BIP-21): include the full URL protocol
    return this.uri;
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.copyContent);
      if (this.debug) {
        console.debug('[bitcoin-qr]: Copied to clipboard:', this.copyContent);
      }
    } catch (err) {
      if (this.debug) {
        console.error('[bitcoin-qr]: Failed to copy to clipboard:', err);
      }
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(this.copyContent);
    }
  }

  fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      if (this.debug) {
        console.debug('[bitcoin-qr]: Fallback copy successful:', text);
      }
    } catch (err) {
      if (this.debug) {
        console.error('[bitcoin-qr]: Fallback copy failed:', err);
      }
    }
    document.body.removeChild(textArea);
  }

  handleClick = (event: Event) => {
    const behavior = this.clickBehavior || 'url';
    if (behavior === 'copy') {
      event.preventDefault();
      this.copyToClipboard();
    } else if (behavior === 'none') {
      event.preventDefault();
    }
    // For 'url' behavior, let the default link behavior work
  };

  // TODO: clear timers when polling is cancelled
  @Watch('isPolling')
  @Watch('pollInterval')
  @Watch('callback')
  poll() {
    if (this.debug) {
      console.debug('[bitcoin-qr]: Polling - ', this.isPolling, this.pollInterval, this.callback);
    }
    if (!this.callback) {
      return;
    }
    if (!this.isPolling) {
      return;
    }

    setTimeout(() => {
      try {
        this.callback();
        this.poll();
      } catch (e) {
        throw new Error(String(e));
      }
    }, this.pollInterval);
  }

  @Watch('clickBehavior')
  handleClickBehaviorChange(newValue: string, oldValue: string) {
    if (this.debug) {
      console.debug('[bitcoin-qr]: clickBehavior changed from', oldValue, 'to', newValue);
    }
    // Force a re-render by calling forceUpdate if available
    // Since this changes the element type, we need a full re-render
  }

  get uri() {
    if (!(this.bitcoin || this.lightning || this.unified)) {
      throw new Error('[bitcoin-qr]: Must pass at least one of the following props to bitcoin-qr: bitcoin, lightning, unified');
    }
    // TODO: unified bip21 validation
    if (this.unified) {
      return encodeURI(this.unified);
    }
    // We only use lightning as protocol if there is no on-chain bitcoin.
    // Otherwise we use it as a parameter.
    // See https://github.com/lightning/bolts/blob/master/10-payment-encoding.md#encoding-overview
    const protocol = this.bitcoin ? 'bitcoin' : 'lightning';
    const pathname = this.bitcoin ? this.bitcoin : this.lightning;
    let _uri: string;
    try {
      _uri = `${protocol}:${pathname}`;
    } catch (e) {
      throw new Error(`[bitcoin-qr]: Invalid URL format: "${protocol}:${pathname}"`);
    }
    if (!this.parameters && (!this.lightning || !this.bitcoin)) {
      // Don't append parameters if there are none
      return encodeURI(_uri);
    }
    try {
      const isLightningOnly = this.lightning && !(this.bitcoin || this.unified);
      const params = isLightningOnly ? this.parameters : `lightning=${this.lightning}&${this.parameters}`;
      _uri = `${_uri}?${params}`;
    } catch (e) {
      throw new Error(`[bitcoin-qr]: Invalid URLSearchParams format: "${this.parameters}"`);
    }
    // TODO: should there be an option to not encode the uri?
    return encodeURI(_uri);
  }

  getDefinedProps() {
    if (!this.uri) {
      throw new Error('[bitcoin-qr]: Must pass at least one of the following props to bitcoin-qr: bitcoin, lightning, unified');
    }
    const optionsKeys = [
      'unified',
      'bitcoin',
      'lightning',
      'parameters',
      'isPolling',
      'pollInterval',
      'width',
      'height',
      'type',
      'margin',
      'image',
      'shape',
      'qrTypeNumber',
      'qrMode',
      'qrErrorCorrectionLevel',
      'imageEmbedded',
      'imageHideBackgroundDots',
      'imageSize',
      'imageCrossOrigin',
      'imageMargin',
      'dotsType',
      'dotsColor',
      // TODO: gradient support
      // 'dotsGradient',
      'dotsType',
      // 'dotsRotation',
      'cornersSquareType',
      'cornersSquareColor',
      // 'cornersSquareGradient',
      'cornersDotType',
      'cornersDotColor',
      // 'cornersDotGradient',
      'backgroundRound',
      'backgroundColor',
      // 'backgroundGradient',
    ];
    const options: Options = {};
    const nestedOptionKeyPrefixes = ['qr', 'image', 'dots', 'cornersSquare', 'cornersDot', 'background'];
    optionsKeys.forEach(key => {
      if (this[key] !== undefined) {
        // Some options have nesting in qr-code-styling, so we need to build the object accordingly
        // e.x.
        // imageOptions {
        //   imageSize: 0.4,
        //   margin: 1
        // }
        // Image is a special case because it has a top-level key just called "image"

        const prefix = nestedOptionKeyPrefixes.find(prefix => key.startsWith(prefix));
        if (key !== 'image' && key !== 'imageEmbedded' && prefix) {
          const optionKey = `${prefix}Options`;
          if (optionKey) {
            if (!options[optionKey]) {
              options[optionKey] = {};
            }
            // imageSize is the one exception where the option has the key in both the top-level and nested object
            if (key === 'imageSize') {
              options[optionKey][key] = this[key];
              return;
            }
            let nestedKey = key.replace(`${prefix}`, '');
            nestedKey = nestedKey[0].toLowerCase() + nestedKey.slice(1);
            const nestedOption = options[optionKey];
            nestedOption[nestedKey] = this[key];
          }
        }

        options[key] = this[key];
      }
    });
    return {
      data: this.uri,
      ...options,
    };
  }

  getImageOverlay() {
    const shadowContainer = this.bitcoinQR.shadowRoot.getElementById('bitcoin-qr-container');
    // If image is not embedded, append an <img> element overlaying it and centered
    if (!this.imageEmbedded && this.image) {
      const img = document.createElement('img');
      img.width = this.imageSize ?? 50;
      img.height = this.imageSize ?? 50;
      img.src = this.image;
      img.style.position = 'absolute';
      img.style.top = '50%';
      img.style.left = '50%';
      img.style.transform = 'translate(-50%, -50%)';
      shadowContainer.appendChild(img);
    }
  }

  componentWillLoad() {
    if (this.debug) {
      console.debug('[bitcoin-qr]: debug mode enabled');
      console.debug('[bitcoin-qr]: Initial clickBehavior value:', this.clickBehavior);
      console.debug('[bitcoin-qr]: click-behavior attribute:', this.bitcoinQR.getAttribute('click-behavior'));
    }
    if (!this.pollInterval) {
      console.warn('[bitcoin-qr]: Attribute "poll-interval" not provided, defaulting to poll every 5 seconds');
      this.pollInterval = 5000;
    }
    if (!this.width) {
      console.warn('[bitcoin-qr]: Attribute "width" not provided, defaulting to 300px');
      this.width = 300;
    }
    if (!this.height) {
      this.height = 300;
    }
    // FIXME: is this not working properly?
    if (!this.type) {
      this.type = 'svg';
    }
    // If image is not embedded, don't pass to qr-code-styling
    this.qr = new QRCodeStyling({ ...this.getDefinedProps(), image: this.imageEmbedded ? this.image : undefined });
    if (this.debug) {
      console.debug('[bitcoin-qr]: Component will load with props', this.getDefinedProps());
    }
  }

  componentDidLoad() {
    const shadowContainer = this.bitcoinQR.shadowRoot.getElementById('bitcoin-qr-container');
    shadowContainer.childElementCount > 0 ? this.qr.update(this.getDefinedProps()) : this.qr.append(shadowContainer);
    shadowContainer.style.position = 'relative'; // For image overlay
    shadowContainer.style.width = `${this.width}px`;
    shadowContainer.style.height = `${this.height}px`;
    shadowContainer.style.display = 'block';
    this.getImageOverlay();
    this.poll();
    if (this.debug) {
      console.debug('[bitcoin-qr]: Component loaded with props', this.getDefinedProps());
      console.debug('[bitcoin-qr]: clickBehavior value:', this.clickBehavior);
      console.debug('[bitcoin-qr]: Container element:', shadowContainer);
      console.debug('[bitcoin-qr]: Container tag name:', shadowContainer.tagName);
    }
  }

  componentShouldUpdate(_new: unknown, _old: unknown, propName: string) {
    // Define which props should not trigger an rerender
    const nonRerenderProps = ['isPolling', 'pollInterval', 'callback', 'debug'];
    
    if (this.debug) {
      console.debug('[bitcoin-qr]: componentShouldUpdate called for prop:', propName);
    }
    
    if (nonRerenderProps.includes(propName)) {
      return false;
    } else {
      // For clickBehavior changes, we need a full re-render since it changes the element type
      if (propName === 'clickBehavior') {
        if (this.debug) {
          console.debug('[bitcoin-qr]: clickBehavior changed, forcing full re-render');
        }
        return true;
      }
      
      this.qr.update({ ...this.getDefinedProps(), image: this.imageEmbedded ? this.image : undefined });
      this.getImageOverlay();
      if (this.debug) {
        console.debug('[bitcoin-qr]: Component updated with props', this.getDefinedProps());
      }
      return true;
    }
  }

  // TODO:
  // i.e. optional copy on click instead of link/uri action
  render() {
    // Default to 'url' if clickBehavior is not set
    const behavior = this.clickBehavior || 'url';
    
    if (this.debug) {
      console.debug('[bitcoin-qr]: Rendering with clickBehavior:', behavior);
      console.debug('[bitcoin-qr]: Original clickBehavior prop:', this.clickBehavior);
      console.debug('[bitcoin-qr]: Rendering element type:', behavior === 'url' ? 'anchor' : 'div');
    }
    
    if (behavior === 'url') {
      const element = <a id="bitcoin-qr-container" href={this.uri}></a>;
      if (this.debug) {
        console.debug('[bitcoin-qr]: Rendering anchor element with href:', this.uri);
      }
      return element;
    } else {
      const element = (
        <div 
          id="bitcoin-qr-container" 
          onClick={this.handleClick}
          style={{ cursor: behavior === 'copy' ? 'pointer' : 'default' }}
        ></div>
      );
      if (this.debug) {
        console.debug('[bitcoin-qr]: Rendering div element with click handler and cursor:', behavior === 'copy' ? 'pointer' : 'default');
      }
      return element;
    }
  }
}
