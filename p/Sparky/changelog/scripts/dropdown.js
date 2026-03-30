class Dropdown {
    constructor(element) {
      this.dropdown = element;
      this.id = element.dataset.dropdownId;
      this.header = element.querySelector('.dropdown-header');
      this.content = element.querySelector('.dropdown-content');
      this.arrow = this.header.querySelector('.dropdown-arrow');
      this.isOpen = false;
      
      this.toggle = this.toggle.bind(this);
      this.header.addEventListener('click', this.toggle);
    }

    toggle(event) {
      event.stopPropagation();
      this.isOpen = !this.isOpen;
      this.dropdown.classList.toggle('active');
    }

    destroy() {
      this.header.removeEventListener('click', this.toggle);
    }
  }

  const dropdowns = new Map();

  document.querySelectorAll('[data-dropdown-id]').forEach(element => {
    const dropdown = new Dropdown(element);
    dropdowns.set(dropdown.id, dropdown);
  });



