import categories from '../resources'
import * as R from 'ramda'
import {
	getAllResources,
	getAllTags,
	includesElOf,
	partiallyIncludesElOf,
	tagsNotEmpty,
	cleanString,
	addCleanTitleAndPath,
} from '../utils/pure'

export const state = () => {
	const resourcesLens = R.lens(R.prop('resources'), R.assoc('resources'))
	return {
		resources: R.map(category => 
				R.over(resourcesLens, R.map(addCleanTitleAndPath(category.slug)), category),
			categories),
		tags: getAllTags(categories),
	}
}

export const getters = {
	tags: R.prop('tags'),
	resources: R.prop('resources'),
	findCategory: state => categoryTitle => {
		// equalsCategoryTitle :: Category -> Bool
		const equalsCategoryTitle = R.compose(
			R.equals(cleanString(categoryTitle)), cleanString, R.prop('title')
		)
		// findCategory :: [Category] -> Category
		const findCategory = R.find(equalsCategoryTitle)
		return findCategory(state.resources)
	},
	findByName: state => names => {
		const cleaned = R.map(cleanString, names)

		// [Resource] -> [Resource]
		const appearsInResource = R.filter(({ cleanTitle, url, desc }) => 
			partiallyIncludesElOf([cleanTitle, url, desc], cleaned)
		)
		// [Category] -> [Resource]
		const getDesiredResources = R.compose(appearsInResource, getAllResources)
		return getDesiredResources(state.resources)
	},
	findByTags: state => tags => {
		const cleaned = R.map(cleanString, tags)

		// containsTags :: [Resource] -> [Resource]
		const containsTags = R.filter(tagsNotEmpty)
		// includesDesiredTags :: Resource -> Bool
		const includesDesiredTags = R.compose(includesElOf(cleaned), R.prop('tags'))
		// findResourcesByTag :: [Resource] -> [Resource]
		const findResourcesByTag = R.filter(includesDesiredTags)
		// getDesiredResources :: [Category] -> [Resource]
		const getDesiredResources = R.compose(findResourcesByTag, containsTags, getAllResources)

		return getDesiredResources(state.resources)
	},
	sortByTitle: (_, getters) => title => {
		const category = getters.findCategory(title)
		const clone = [...category.resources]
		return {
			...category,
			resources: clone.sort(compareTitles),
		}
	},
}

const compareTitles = (x, y) => {
	if (x.cleanTitle > y.cleanTitle) {
			return 1
	} else if (x.cleanTitle < y.cleanTitle) {
			return -1
	} else {
		return 0
	}
}