/**
 * Steganography Encoder/Decoder
 * Hides text messages in image pixel data using LSB (Least Significant Bit) encoding.
 * Entirely client-side using the HTML5 Canvas API.
 */

(function () {
    'use strict';

    // ── Shared state ──────────────────────────────────────────────────
    var encodeCanvas = null;
    var encodeCtx = null;
    var encodeImageLoaded = false;

    var decodeCanvas = null;
    var decodeCtx = null;
    var decodeImageLoaded = false;

    // ── Helpers ───────────────────────────────────────────────────────

    /**
     * Convert a string to an array of bits (UTF-8 encoded).
     */
    function textToBits(text) {
        var encoder = new TextEncoder();
        var bytes = encoder.encode(text);
        var bits = [];
        for (var i = 0; i < bytes.length; i++) {
            for (var b = 7; b >= 0; b--) {
                bits.push((bytes[i] >> b) & 1);
            }
        }
        return bits;
    }

    /**
     * Convert an array of bits back to a UTF-8 string.
     */
    function bitsToText(bits) {
        var bytes = [];
        for (var i = 0; i + 7 < bits.length; i += 8) {
            var byte = 0;
            for (var b = 0; b < 8; b++) {
                byte = (byte << 1) | bits[i + b];
            }
            bytes.push(byte);
        }
        var decoder = new TextDecoder();
        return decoder.decode(new Uint8Array(bytes));
    }

    /**
     * Convert a 32-bit integer to an array of 32 bits.
     */
    function int32ToBits(num) {
        var bits = [];
        for (var i = 31; i >= 0; i--) {
            bits.push((num >> i) & 1);
        }
        return bits;
    }

    /**
     * Convert an array of 32 bits to a 32-bit integer.
     */
    function bitsToInt32(bits) {
        var num = 0;
        for (var i = 0; i < 32; i++) {
            num = (num << 1) | bits[i];
        }
        return num;
    }

    /**
     * Show a status message in the given element.
     */
    function showStatus(elementId, message, isError) {
        var el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = message;
        el.style.color = isError ? '#ff6b6b' : '#69db7c';
        el.style.display = message ? 'block' : 'none';
    }

    // ── Encode ────────────────────────────────────────────────────────

    /**
     * Load a carrier image onto the encode canvas.
     */
    window.stegLoadEncodeImage = function () {
        var input = document.getElementById('steg-encode-file');
        if (!input.files || !input.files[0]) return;

        var file = input.files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                encodeCanvas = document.getElementById('steg-encode-canvas');
                encodeCtx = encodeCanvas.getContext('2d');

                // Scale to fit while maintaining aspect ratio, max 800px wide
                var maxW = 800;
                var scale = img.width > maxW ? maxW / img.width : 1;
                encodeCanvas.width = Math.floor(img.width * scale);
                encodeCanvas.height = Math.floor(img.height * scale);
                encodeCtx.drawImage(img, 0, 0, encodeCanvas.width, encodeCanvas.height);

                encodeImageLoaded = true;
                encodeCanvas.style.display = 'block';

                var capacity = Math.floor((encodeCanvas.width * encodeCanvas.height * 3 - 32) / 8);
                showStatus('steg-encode-status', 'Image loaded. Capacity: ~' + capacity.toLocaleString() + ' characters.', false);
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    };

    /**
     * Encode the secret message into the loaded image.
     */
    window.stegEncode = function () {
        showStatus('steg-encode-status', '', false);

        if (!encodeImageLoaded) {
            showStatus('steg-encode-status', 'Please load an image first.', true);
            return;
        }

        var message = document.getElementById('steg-encode-text').value;
        if (!message) {
            showStatus('steg-encode-status', 'Please enter a message to hide.', true);
            return;
        }

        var messageBits = textToBits(message);
        var lengthBits = int32ToBits(messageBits.length);
        var allBits = lengthBits.concat(messageBits);

        var imageData = encodeCtx.getImageData(0, 0, encodeCanvas.width, encodeCanvas.height);
        var pixels = imageData.data;

        // Each pixel gives 3 usable channels (R, G, B — skip A)
        var totalCapacity = (pixels.length / 4) * 3;
        if (allBits.length > totalCapacity) {
            showStatus('steg-encode-status', 'Message is too long for this image. Max ~' + Math.floor((totalCapacity - 32) / 8) + ' characters.', true);
            return;
        }

        var bitIndex = 0;
        for (var i = 0; i < pixels.length && bitIndex < allBits.length; i++) {
            // Skip alpha channel (every 4th byte)
            if ((i + 1) % 4 === 0) continue;

            pixels[i] = (pixels[i] & 0xFE) | allBits[bitIndex];
            bitIndex++;
        }

        encodeCtx.putImageData(imageData, 0, 0);

        // Enable download
        var downloadBtn = document.getElementById('steg-encode-download');
        downloadBtn.style.display = 'inline-block';
        downloadBtn.onclick = function () {
            var link = document.createElement('a');
            link.download = 'steg-encoded.png';
            link.href = encodeCanvas.toDataURL('image/png');
            link.click();
        };

        showStatus('steg-encode-status', 'Message encoded successfully! Click Download to save.', false);
    };

    // ── Decode ────────────────────────────────────────────────────────

    /**
     * Load an image for decoding onto the decode canvas.
     */
    window.stegLoadDecodeImage = function () {
        var input = document.getElementById('steg-decode-file');
        if (!input.files || !input.files[0]) return;

        var file = input.files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                decodeCanvas = document.getElementById('steg-decode-canvas');
                decodeCtx = decodeCanvas.getContext('2d');

                // Use original dimensions for accurate decoding
                decodeCanvas.width = img.width;
                decodeCanvas.height = img.height;
                decodeCtx.drawImage(img, 0, 0);

                decodeImageLoaded = true;
                decodeCanvas.style.display = 'block';
                decodeCanvas.style.maxWidth = '100%';

                showStatus('steg-decode-status', 'Image loaded. Click Decode to extract the hidden message.', false);
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    };

    /**
     * Decode the hidden message from the loaded image.
     */
    window.stegDecode = function () {
        showStatus('steg-decode-status', '', false);
        document.getElementById('steg-decode-text').value = '';

        if (!decodeImageLoaded) {
            showStatus('steg-decode-status', 'Please load an image first.', true);
            return;
        }

        var imageData = decodeCtx.getImageData(0, 0, decodeCanvas.width, decodeCanvas.height);
        var pixels = imageData.data;

        // Extract bits from LSBs of RGB channels
        var extractedBits = [];
        for (var i = 0; i < pixels.length; i++) {
            if ((i + 1) % 4 === 0) continue; // Skip alpha
            extractedBits.push(pixels[i] & 1);
        }

        // Read 32-bit length header
        if (extractedBits.length < 32) {
            showStatus('steg-decode-status', 'Image is too small to contain steganographic data.', true);
            return;
        }

        var lengthBits = extractedBits.slice(0, 32);
        var messageBitLength = bitsToInt32(lengthBits);

        // Sanity check
        if (messageBitLength <= 0 || messageBitLength > extractedBits.length - 32 || messageBitLength % 8 !== 0) {
            showStatus('steg-decode-status', 'No hidden message found in this image.', true);
            return;
        }

        var messageBits = extractedBits.slice(32, 32 + messageBitLength);
        var message = bitsToText(messageBits);

        document.getElementById('steg-decode-text').value = message;
        showStatus('steg-decode-status', 'Hidden message extracted successfully! (' + (messageBitLength / 8) + ' characters)', false);
    };

})();
