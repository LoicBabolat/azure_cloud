import e from "express"
import {auCarre, auCube} from './functions/test'

const app: e.Application = e();

// Ressource static
app.use(e.static(__dirname + '/public'))

app.set('view engine', 'ejs')

app.set('views', __dirname + '/views');

app.use((req, res, next) => {
    console.log("Requête fonctionnelle, faite le " + Date.now());
    //Pour passer au prochain middleware
    next()
})

app.get('/', (req, res) => {
    res.render('index', { title: 'index EJS avec express', test: "Voici le test1", auCube: auCube, auCarre: auCarre});
});

// Ne s'exécute que si les middelware (get, post...) précédent ne se sont pas exécuter
app.use((req, res) => {
    res.status(404).render('erreur')
})

app.listen(process.env.PORT || 3000, () => {
    console.log('En attente de requêtes au port 3000');
})