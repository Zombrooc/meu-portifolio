const getDisplay = () => {
  const currentUrl = window.location.href;

  console.log(currentUrl);

  let display = undefined;

  if (currentUrl.includes("portifolio")) {
    display = "portifolio";
  }

  if (currentUrl.includes("galeria")) {
    display = "galeria";
  }

  return display;
};

async function loadImages(display) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/imagens?display=${display}`
    );
    const images = await response.json();

    console.log("Images: ", images);
    const container = document.getElementById("image-container");

    const fragment = document.createDocumentFragment(); // Cria um fragmento de documento para otimizar

    images.forEach((image) => {
      const div = document.createElement("div");
      div.id = `image-${image.id}`;

      const imgElement = document.createElement("img");
      imgElement.src = image.url;
      imgElement.alt = image.descricao || "Imagem sem descrição";
      imgElement.style.width = "100%";

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Excluir";
      deleteButton.onclick = () => deleteImage(image.id);

      div.appendChild(imgElement);
      div.appendChild(deleteButton);
      fragment.appendChild(div); // Adiciona ao fragmento
    });

    container.appendChild(fragment); // Insere todas as mudanças de uma vez no DOM
  } catch (error) {
    console.error("Erro ao carregar imagens:", error);
  }
}

// // Função para excluir uma imagem

const deleteImage = async (imageId) => {
  console.log(imageId);
  if (confirm("Tem certeza que deseja excluir esta imagem?")) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/imagens/${imageId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        alert("Imagem excluída com sucesso!");
        const display = getDisplay();
        loadImages(display); // Atualiza a lista de imagens na seção #portfolio
      } else {
        throw new Error("Erro ao excluir imagem");
      }
    } catch (error) {
      console.error("Erro ao excluir imagem:", error);
    }
  }
};

// Função para carregar os temas
async function loadThemes() {
  try {
    const themesContainer = document.getElementById("themes-container");
    themesContainer.innerHTML = "";
    const response = await fetch("http://localhost:3000/api/temas"); // URL completa
    const themes = await response.json();

    const temaSelect = document.getElementById("tema-select");
    temaSelect.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Selecione um Tema";
    temaSelect.appendChild(defaultOption);

    themes.map(({ id, titulo }) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = titulo;
      temaSelect.appendChild(option);
    });

    //Adiciona uma opção padrão

    // Adiciona os temas carregados
    themes.forEach((theme) => {
      const div = document.createElement("div");
      div.id = `theme-${theme.id}`;

      const h3 = document.createElement("h3");
      h3.textContent = theme.titulo;

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Excluir";
      deleteButton.onclick = () => deleteTheme(theme.id); // Usando arrow function para manter o escopo correto

      div.appendChild(h3);
      div.appendChild(deleteButton);
      document.getElementById("themes-container").appendChild(div);
    });
  } catch (error) {
    console.error("Erro ao carregar temas:", error);
  }
}

// // Função para exibir os temas com botão de excluir
// function displayThemesWithDelete(themes) {
//   const container = document.getElementById("themes-container");
//   container.innerHTML = ""; // Limpa o contêiner de temas antes de adicionar os novos

//   themes.forEach((theme) => {
//     const div = document.createElement("div");
//     div.classList.add("theme-item");

//     const title = document.createElement("span");
//     title.textContent = theme.titulo;
//     div.appendChild(title);

//     const deleteButton = document.createElement("button");
//     deleteButton.textContent = "Excluir Tema";
//     deleteButton.onclick = () => deleteTheme(theme.id); // Exclui o tema
//     div.appendChild(deleteButton);

//     container.appendChild(div);
//   });
// }
// //Função para excluir tema
const deleteTheme = async (themeId) => {
  if (confirm("Tem certeza que deseja excluir este tema?")) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/temas/${themeId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        alert("Tema excluído com sucesso!");

        loadThemes(); // Atualiza a lista de temas
      } else {
        throw new Error("Erro ao excluir tema");
      }
    } catch (error) {
      console.error("Erro ao excluir tema:", error);
    }
  }
};

// // Função para adicionar imagem
// document
//   .getElementById("add-image-form")
//   .addEventListener("submit", function (event) {
//     event.preventDefault();

//     const formData = new FormData(this);
//     const selectedTemaId = document.getElementById("tema-select").value;

//     // Se não houver tema selecionado, mostra um erro
//     if (!selectedTemaId) {
//       alert("Por favor, selecione um tema");
//       return;
//     }

//     formData.append("tema_id", selectedTemaId); // Adiciona o ID do tema ao FormData

//     fetch("http://localhost:3000/api/imagens", {
//       method: "POST",
//       body: formData,
//     })
//       .then((response) => response.json())
//       .then((data) => {
//         alert("Imagem adicionada com sucesso!");
//         loadImages(); // Atualiza a lista de imagens na seção #portfolio
//       })
//       .catch((error) => {
//         console.error("Erro ao adicionar imagem:", error);
//       });
//   });

document

  .getElementById("add-image-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    // Manually collect form values

    const form = document.querySelector("#add-image-form");
    const formData = new FormData(form);

    // Call function to submit form data
    // Create an object with form data
    // const formData = {
    //   tema_id: tema,
    //   imagem: file[0],
    // };

    fetch("http://localhost:3000/api/imagens", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        alert("Imagem adicionada com sucesso!");

        const display = getDisplay();
        loadImages(display); // Atualiza a lista de imagens na seção #portfolio
      })
      .catch((error) => {
        console.error("Erro ao adicionar imagem:", error);
      });
  });

document
  .getElementById("create-theme-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    // Manually collect form values
    const titulo = document.getElementById("theme-title").value;
    const descricao = document.getElementById("theme-description").value;

    console.log(titulo);
    // Create an object with form data
    const formData = {
      titulo,
      descricao,
    };

    fetch("http://localhost:3000/api/temas", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        alert("Tema adicionada com sucesso!");
        loadThemes();
      })
      .catch((error) => {
        console.error("Erro ao adicionar imagem:", error);
      });
  });

document.addEventListener("DOMContentLoaded", function () {
  // Função para carregar as imagens
  console.log("Page Loaded");
  // Função para carregar os temas e imagens ao iniciar a página
  loadThemes();

  const display = getDisplay();

  loadImages(display || "ambos");
});
