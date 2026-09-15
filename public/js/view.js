export function renderMessages(messages, container) {
  const lignes = messages.map((msg) => {
    const li = document.createElement("li");
    const prefixe = msg.role === "user" ? "Vous : " : "Archia : ";
    li.textContent = `${prefixe}${msg.text}`;
    return li;
  });
  container.replaceChildren(...lignes);
}
