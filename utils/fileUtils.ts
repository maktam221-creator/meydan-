/**
 * Converts a File object to a base64 encoded string.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string (without the data: URL prefix).
 */
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result is in the format "data:image/jpeg;base64,LzlqLzRBQ...".
      // We only need the part after the comma.
      const base64String = (reader.result as string).split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to read base64 string from file."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
