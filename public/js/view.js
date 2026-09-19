export function renderMessages(messages, container) {
  const lignes = messages.map((msg) => {
    const li = document.createElement("li");
    const prefixe = msg.role === "user" ? "Vous : " : "ArchiA : ";
    li.textContent = `${prefixe}${msg.text}`;
    li.className = msg.role === "user" ? "msg-user" : "msg-bot";
    return li;
  });
  container.replaceChildren(...lignes);
}
