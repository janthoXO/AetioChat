export class XMLReasoningFilter {
  private isThinking = false;
  private buffer = "";
  private readonly START_TAG = "<reasoning>";
  private readonly END_TAG = "</reasoning>";

  /**
   * Processes a raw chunk from the LLM and returns ONLY the text
   * that is safe to stream to the user.
   */
  public processChunk(chunk: string): string {
    this.buffer += chunk;
    let outputToUser = "";

    // Keep processing the buffer as long as it has content
    while (this.buffer.length > 0) {
      if (!this.isThinking) {
        const startIndex = this.buffer.indexOf(this.START_TAG);

        if (startIndex !== -1) {
          // 1. We found a complete start tag!
          // Everything before the tag is safe to output.
          outputToUser += this.buffer.slice(0, startIndex);
          this.isThinking = true;
          // Trim the buffer up to the end of the start tag
          this.buffer = this.buffer.slice(startIndex + this.START_TAG.length);
        } else {
          // 2. No complete start tag. Check if the buffer ends with a PARTIAL start tag.
          const partialMatchLength = this.getPartialMatchLength(
            this.buffer,
            this.START_TAG
          );

          if (partialMatchLength > 0) {
            // It ends with a partial tag (e.g., "<reas").
            // Output everything before the partial match, and keep the partial match in the buffer.
            const safePart = this.buffer.slice(
              0,
              this.buffer.length - partialMatchLength
            );
            outputToUser += safePart;
            this.buffer = this.buffer.slice(
              this.buffer.length - partialMatchLength
            );
            break; // Wait for the next chunk to complete the tag
          } else {
            // No partial match at all. The entire buffer is safe to stream!
            outputToUser += this.buffer;
            this.buffer = "";
            break;
          }
        }
      } else {
        // --- WE ARE CURRENTLY THINKING ---
        const endIndex = this.buffer.indexOf(this.END_TAG);

        if (endIndex !== -1) {
          // 1. We found a complete end tag!
          this.isThinking = false;
          // Trim the buffer up to the end of the closing tag.
          // (We do not output anything, because everything before the end tag was private reasoning).
          this.buffer = this.buffer.slice(endIndex + this.END_TAG.length);
        } else {
          // 2. No complete end tag. Check if the buffer ends with a PARTIAL end tag.
          const partialMatchLength = this.getPartialMatchLength(
            this.buffer,
            this.END_TAG
          );

          if (partialMatchLength > 0) {
            // Keep ONLY the partial match in the buffer.
            // Discard the rest of the buffer because it is private reasoning.
            this.buffer = this.buffer.slice(
              this.buffer.length - partialMatchLength
            );
            break; // Wait for the next chunk to complete the tag
          } else {
            // No partial match. The entire buffer is private reasoning. Discard it!
            this.buffer = "";
            break;
          }
        }
      }
    }

    return outputToUser;
  }

  /**
   * Helper function to check if the end of 'str' overlaps with the start of 'target'.
   * Returns the length of the overlap.
   */
  private getPartialMatchLength(str: string, target: string): number {
    // The overlap can't be longer than the target string minus 1
    const maxOverlap = Math.min(str.length, target.length - 1);

    for (let i = maxOverlap; i > 0; i--) {
      if (str.endsWith(target.substring(0, i))) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Call this when the LLM stream completely finishes to flush any safe
   * remaining text that was stuck in the buffer.
   */
  public flush(): string {
    let output = "";
    if (!this.isThinking && this.buffer.length > 0) {
      output = this.buffer;
    }
    this.buffer = "";
    this.isThinking = false;
    return output;
  }
}
