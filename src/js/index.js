import Search from './models/Search'
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import {clearLoader, elements, renderLoader} from './views/base'
import Recipe from './models/Recipe'
import List from './models/List'
import Likes from "./models/Likes";

/* Global state of the app
 * - Search object
 * - current recipe object
 * - shopping list objects
 * - liked recipes
*/
const state = {};

// SEARCH CONTROLLER

const controlSearch = async () => {
    // 1. Get query from view
    const query = searchView.getInput();

    if (query) {
        state.search = new Search(query);

        // 3. Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try {
            // 4. Search for recipes
            await state.search.getResults();

            // 5. render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            alert('Something wrong with the search');
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');

    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

// RECIPE CONTROLLER

const controlRecipe = async () => {
    const id = window.location.hash.replace("#", '');
    console.log(id);

    if (id) {
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        if (state.search) searchView.highlightSelected(id);

        state.recipe = new Recipe(id);

        try {
            await state.recipe.getRecipe();
            state.recipe.calculateServings();
            state.recipe.calculateTime();
            state.recipe.parseIngredients();

            // render recipe
            clearLoader();

            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
            );
        } catch (error) {
            console.log(error);
            alert('Error processing recipe!')
        }
    }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// LIST CONTROLLER
const controlList = () => {
    if (!state.list) state.list = new List();

    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        state.list.deleteItem(id);
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

// TODO remove and use storage, it's just for testing purposes
state.likes = new Likes();
likesView.toggleLikeMenu(state.likes.getNumberOfLikes());

// LIKE CONTROLLER
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();

    const currentId = state.recipe.id;
    if (!state.likes.isLiked(currentId)) {
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );

        likesView.toggleLikeBtn(true);

        likesView.renderLike(newLike);
    } else {
        state.likes.deleteLike(currentId);

        likesView.toggleLikeBtn(false);

        likesView.deleteLike(currentId);
    }

    likesView.toggleLikeMenu(state.likes.getNumberOfLikes());
};

// Handle recipe button clicks
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        state.recipe.updateServings('inc');
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike()
    }

    recipeView.updateServingsIngredients(state.recipe);
});
