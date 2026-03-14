        // Simule um processo de inicialização
        //setTimeout(() => {
            //document.getElementById('boot-logo').innerHTML = '0.1';
        //}, 3000); // Simula uma inicialização de 3 segundos

        function createRaindrop() {
            const drop = document.createElement("div");
            drop.className = "drop";
            drop.style.left = `${Math.random() * 100}vw`; // Posição horizontal aleatória
            drop.style.animationDuration = `${Math.random() * 1 + 0.5}s`; // Duração da animação aleatória
            document.body.appendChild(drop);
            
            drop.addEventListener("animationiteration", () => {
              // Remover a gota de chuva quando ela atinge o final da animação
              drop.remove();
              createRaindrop(); // Criar uma nova gota para substituir a que foi removida
            });
          }
          
          // Criar gotas de chuva iniciais
          for (let i = 0; i < 100; i++) {
            createRaindrop();
          }

          
          function redirectToOverboot() {
            window.location.href = "fast-boot.html";
          }
      
          // Função para lidar com eventos de teclado
          function handleKeyPress(event) {
            const key = event.key;
            if (key === "2") {
              redirectToOverboot();
            }
          }

          function boot() {
            window.location.href = "overboot.html";
          }
      
          // Função para lidar com eventos de teclado
          function handleKeyPress(event) {
            const key = event.key;
            if (key === "1") {
              boot();
            }
          }
      
          // Adicionar um ouvinte de evento de clique na página
          document.body.addEventListener("keydown", handleKeyPress);
          
        