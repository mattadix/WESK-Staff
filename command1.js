// Toto je miesto, kde sa kontroluje prefix a príkaz
if (!message.content.startsWith(PREFIX)) return;  // PREFIX je '!'

const args = message.content.slice(PREFIX.length).trim().split(/ +/);
const command = args.shift().toLowerCase();

if (command === 'test') {
  // Tu sa vykoná kód pre príkaz !ticket
}



function runCommand(input) {
  if (input.startsWith('/message ')) {
    const message = input.slice(9); // odstráni "/message "
    console.log("Správa: " + message);
  } else {
    console.log("Neznámy príkaz.");
  }
}
