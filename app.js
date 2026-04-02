const imageInput = document.getElementById("imageInput");
const pasteBtn = document.getElementById("pasteBtn");
const previewImage = document.getElementById("previewImage");
const emptyPreview = document.getElementById("emptyPreview");
const scanType = document.getElementById("scanType");
const scanBtn = document.getElementById("scanBtn");
const statusEl = document.getElementById("status");
const resultText = document.getElementById("resultText");
const copyBtn = document.getElementById("copyBtn");

let selectedImage = null;

function setImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    statusEl.textContent = "Please choose a valid image file.";
    return;
  }

  selectedImage = file;
  const objectUrl = URL.createObjectURL(file);
  previewImage.src = objectUrl;
  previewImage.style.display = "block";
  emptyPreview.style.display = "none";
  statusEl.textContent = `Loaded image: ${file.name || "pasted image"}`;
}

imageInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  setImage(file);
});

pasteBtn.addEventListener("click", () => {
  statusEl.textContent = "Paste now with Ctrl+V.";
});

document.addEventListener("paste", (event) => {
  const item = [...event.clipboardData.items].find((entry) =>
    entry.type.startsWith("image/")
  );

  if (!item) {
    return;
  }

  const file = item.getAsFile();
  setImage(file);
});

function extractByType(text, type) {
  const cleaned = text.trim();
  if (!cleaned) {
    return "No text recognized.";
  }

  if (type === "all") {
    return cleaned;
  }

  if (type === "name") {
    const nameMatch = cleaned.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g);
    return nameMatch?.[0] || "No likely name found.";
  }

  if (type === "date") {
    const dateRegex = /(\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b)|(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b)/i;
    return cleaned.match(dateRegex)?.[0] || "No likely date found.";
  }

  if (type === "amount") {
    const amountRegex = /(\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\b\d{1,3}(?:,\d{3})*(?:\.\d{2})\b)/;
    return cleaned.match(amountRegex)?.[0] || "No likely amount found.";
  }

  return cleaned;
}

scanBtn.addEventListener("click", async () => {
  if (!selectedImage) {
    statusEl.textContent = "Please upload or paste an image first.";
    return;
  }

  try {
    scanBtn.disabled = true;
    copyBtn.disabled = true;
    statusEl.textContent = "Running OCR...";

    const { data } = await Tesseract.recognize(selectedImage, "eng");
    const extracted = extractByType(data.text, scanType.value);

    resultText.value = extracted;
    statusEl.textContent = "Extraction complete.";
  } catch (error) {
    resultText.value = "";
    statusEl.textContent = `OCR failed: ${error.message}`;
  } finally {
    scanBtn.disabled = false;
    copyBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  if (!resultText.value.trim()) {
    statusEl.textContent = "Nothing to copy yet.";
    return;
  }

  try {
    await navigator.clipboard.writeText(resultText.value);
    statusEl.textContent = "Copied to clipboard.";
  } catch (error) {
    statusEl.textContent = "Copy failed. Your browser may block clipboard access.";
  }
});
