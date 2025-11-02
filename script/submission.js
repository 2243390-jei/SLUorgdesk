document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("submissionForm");


  document.querySelectorAll(".drop-zone__input").forEach((inputElement) => {
    const dropZone = inputElement.closest(".drop-zone");
    if (!dropZone) return;

    const defaultContent = dropZone.innerHTML;
    const originalInput = inputElement.cloneNode(true);

    dropZone.addEventListener("click", (e) => {
      if (!e.target.classList.contains("remove-file-btn")) {
        const currentInput = dropZone.querySelector(".drop-zone__input");
        if (currentInput) currentInput.click();
      }
    });

    inputElement.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file) updateDropZone(dropZone, file, defaultContent, originalInput);
    });

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("drop-zone--over");
    });

    ["dragleave", "dragend"].forEach((type) => {
      dropZone.addEventListener(type, () => dropZone.classList.remove("drop-zone--over"));
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        const currentInput = dropZone.querySelector(".drop-zone__input");
        if (currentInput) {
          currentInput.files = e.dataTransfer.files;
          updateDropZone(dropZone, file, defaultContent, originalInput);
        }
      }
      dropZone.classList.remove("drop-zone--over");
    });
  });

  function updateDropZone(dropZone, file, defaultContent, originalInput) {
    if (!file || !dropZone) return;
    
    const newInput = originalInput.cloneNode(true);
    newInput.files = new FileList();

    const filePreview = document.createElement("div");
    filePreview.classList.add("file-preview");

    const thumb = document.createElement("div");
    thumb.classList.add("file-thumb");

    try {
      if (file.type?.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        thumb.appendChild(img);
      } else {
        const icon = document.createElement("div");
        icon.classList.add("file-icon");
        const ext = file.name?.split(".")?.pop() || "FILE";
        icon.textContent = ext.toUpperCase();
        thumb.appendChild(icon);
      }
    } catch (e) {
      const icon = document.createElement("div");
      icon.classList.add("file-icon");
      icon.textContent = "FILE";
      thumb.appendChild(icon);
    }

    const fileName = document.createElement("span");
    fileName.textContent = file.name || "Unknown File";
    fileName.classList.add("file-name");

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.classList.add("remove-file-btn");
    removeBtn.textContent = "Remove";

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropZone.innerHTML = defaultContent;
      const newInput = originalInput.cloneNode(true);
      dropZone.querySelector("input")?.remove();
      dropZone.appendChild(newInput);

      newInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          updateDropZone(dropZone, file, defaultContent, originalInput);
        }
      });
    });

    filePreview.appendChild(thumb);
    filePreview.appendChild(fileName);
    filePreview.appendChild(removeBtn);

    dropZone.innerHTML = "";
    dropZone.appendChild(filePreview);
    newInput.files = file.files || new FileList();
    dropZone.appendChild(newInput);
  }

  function createInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.classList.add("drop-zone__input");
    return input;
  }
  const sdgCheckboxes = document.querySelectorAll(".sdg-options input[type='checkbox']");
  sdgCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const selectedSDGs = Array.from(sdgCheckboxes)
        .filter((c) => c.checked)
        .map((c) => c.value);
      console.log("Selected SDGs:", selectedSDGs); 
    });
  });

  form.addEventListener("reset", (e) => {
    const confirmReset = confirm("Are you sure you want to clear all form data?");
    if (!confirmReset) e.preventDefault();
    else {
      document.querySelectorAll(".drop-zone").forEach((dropZone) => {
        const input = dropZone.querySelector(".drop-zone__input") || createInput();
        dropZone.innerHTML = `
          <img src="../Images/student_img/submit/upload_icon.png" alt="Upload Icon" class="upload-icon">
          <span class="drop-zone__prompt">Drag & Drop file here or click to browse</span>
        `;
        dropZone.appendChild(input);
        input.addEventListener("change", () => {
          if (input.files.length) updateDropZone(dropZone, input.files[0]);
        });
      });

      sdgCheckboxes.forEach((c) => (c.checked = false));
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      alert("Please fill out all required fields before submitting.");
      return;
    }


    const selectedSDGs = Array.from(sdgCheckboxes)
      .filter((c) => c.checked)
      .map((c) => c.value);
    console.log("Submitted SDGs:", selectedSDGs);

    alert("Submission successful! Your documents have been recorded.");
    form.reset();
  });
});
