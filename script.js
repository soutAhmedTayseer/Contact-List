$(function () {
  const STORAGE_KEY = "contacts_v1";
  let contacts = [];
  let currentContactId = null;

  // Load contacts from localStorage or create sample data
  function loadContacts() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        contacts = JSON.parse(raw);
      } catch (err) {
        console.error("Failed to parse contacts from storage, resetting:", err);
        contacts = [];
      }
    }

    if (!contacts || contacts.length === 0) {
      // sample initial data
      contacts = [
        {
          id: 1,
          name: "Mona Abdo",
          phone: "(202) 555-0100",
          email: "mona.abdo@example.com",
          gender: "female",
        },
        {
          id: 2,
          name: "Karim Ali",
          phone: "(202) 555-0101",
          email: "karim.ali@example.com",
          gender: "male",
        },
        {
          id: 3,
          name: "Mohamed Said",
          phone: "(202) 555-0102",
          email: "mohamed.said@example.com",
          gender: "male",
        },
        {
          id: 4,
          name: "Eman Ali",
          phone: "(202) 555-0103",
          email: "eman.ali@example.com",
          gender: "female",
        },
      ];
      saveContacts();
    }
    renderContactList();
  }

  // Save contacts to localStorage
  function saveContacts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }

  // Render the listview
  function renderContactList() {
    const $contactList = $("#contactList");
    $contactList.empty();

    if (!contacts || contacts.length === 0) {
      $contactList.append(
        '<li data-role="list-divider">No contacts yet. Add one!</li>'
      );
    } else {
      contacts.forEach((contact) => {
        const avatar =
          contact.gender === "male" ? "img/male.png" : "img/female.png";
        const li = $(`
          <li data-id="${contact.id}">
            <a href="#contactDetailsPage" class="view-contact">
              <img src="${avatar}" alt="${contact.name}">
              <h2>${escapeHtml(contact.name)}</h2>
              <p>${escapeHtml(contact.phone)}</p>
            </a>
            <a href="#" class="edit-contact" data-id="${contact.id}">Edit</a>
          </li>
        `);
        $contactList.append(li);
      });
    }

    // refresh listview
    if ($contactList.hasClass("ui-listview") || $.mobile) {
      try {
        $contactList.listview("refresh");
      } catch (e) {
        // ignore if refresh not available yet
      }
    }
  }

  // Simple HTML escaper
  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Reset form to defaults
  function resetForm() {
    $("#contactForm")[0].reset();
    $("#contactId").val("");
    $("#male").prop("checked", true).checkboxradio("refresh");
    $("#female").prop("checked", false).checkboxradio("refresh");
  }

  // When 'Add' clicked in header
  $(document).on("click", "#home .ui-btn-right", function () {
    $("#addEditHeader").text("New Contact");
    resetForm();
  });

  // Edit from list (split button)
  $(document).on("click", ".edit-contact", function (e) {
    e.preventDefault();
    e.stopPropagation(); // don't open details
    const id = parseInt($(this).data("id"), 10);
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    $("#addEditHeader").text("Edit Contact");
    $("#contactId").val(contact.id);
    $("#name").val(contact.name);
    $("#phone").val(contact.phone);
    $("#email").val(contact.email);
    if (contact.gender === "male") {
      $("#male").prop("checked", true).checkboxradio("refresh");
      $("#female").prop("checked", false).checkboxradio("refresh");
    } else {
      $("#female").prop("checked", true).checkboxradio("refresh");
      $("#male").prop("checked", false).checkboxradio("refresh");
    }
    $.mobile.changePage("#addContactPage");
  });

  // Save contact (with validation)
  $(document).on("click", "#saveContactBtn", function (e) {
    e.preventDefault();

    const idVal = $("#contactId").val();
    const name = $("#name").val().trim();
    const phone = $("#phone").val().trim();
    const email = $("#email").val().trim();
    const gender = $('input[name="gender"]:checked').val();

    // ====== VALIDATION SECTION ======
    const nameRegex = /^[A-Za-z\s]{2,}$/;
    if (!nameRegex.test(name)) {
      alert(
        "Please enter a valid name (letters and spaces only, at least 2 characters)."
      );
      $("#name").focus();
      return;
    }

    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    if (!phoneRegex.test(phone) || phone.length < 6) {
      alert("Please enter a valid phone number.");
      $("#phone").focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      $("#email").focus();
      return;
    }

    if (!gender) {
      alert("Please select a gender.");
      return;
    }

    // ====== ADD / UPDATE CONTACT ======
    if (idVal) {
      const idNum = parseInt(idVal, 10);
      const idx = contacts.findIndex((c) => c.id === idNum);
      if (idx !== -1) {
        contacts[idx] = { id: idNum, name, phone, email, gender };
      }
    } else {
      const newId = contacts.length
        ? Math.max(...contacts.map((c) => c.id)) + 1
        : 1;
      contacts.push({ id: newId, name, phone, email, gender });
    }

    saveContacts();
    renderContactList();
    $.mobile.changePage("#home");
  });

  // View contact details
  $(document).on("click", ".view-contact", function () {
    const id = parseInt($(this).closest("li").data("id"), 10);
    currentContactId = id;
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;

    $("#detailsName").text(contact.name);
    $("#detailsPhone").html(
      `<strong>Phone:</strong> ${escapeHtml(contact.phone)}`
    );
    $("#detailsEmail").html(
      `<strong>Email:</strong> ${escapeHtml(contact.email)}`
    );
    $("#detailsGender").html(
      `<strong>Gender:</strong> ${escapeHtml(capitalize(contact.gender))}`
    );
    const avatar =
      contact.gender === "male" ? "img/male.png" : "img/female.png";
    $("#detailsPic").attr("src", avatar);
  });

  // Edit from details page
  $(document).on("click", "#editFromDetailsBtn", function (e) {
    e.preventDefault();
    if (!currentContactId) return;
    const contact = contacts.find((c) => c.id === currentContactId);
    if (!contact) return;

    $("#addEditHeader").text("Edit Contact");
    $("#contactId").val(contact.id);
    $("#name").val(contact.name);
    $("#phone").val(contact.phone);
    $("#email").val(contact.email);
    if (contact.gender === "male") {
      $("#male").prop("checked", true).checkboxradio("refresh");
      $("#female").prop("checked", false).checkboxradio("refresh");
    } else {
      $("#female").prop("checked", true).checkboxradio("refresh");
      $("#male").prop("checked", false).checkboxradio("refresh");
    }
    $.mobile.changePage("#addContactPage");
  });

  // Delete from details page
  $(document).on("click", "#deleteFromDetailsBtn", function (e) {
    e.preventDefault();
    if (!currentContactId) return;

    const contact = contacts.find((c) => c.id === currentContactId);
    const name = contact ? contact.name : "this contact";
    const confirmed = confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    contacts = contacts.filter((c) => c.id !== currentContactId);
    saveContacts();
    renderContactList();
    currentContactId = null;
    $.mobile.changePage("#home");
  });

  // utility
  function capitalize(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Refresh contact list on home page load
  $(document).on("pagebeforeshow", "#home", function () {
    renderContactList();
  });

  // Initialize
  loadContacts();
});
