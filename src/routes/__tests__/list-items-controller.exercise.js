// Testing Controllers
import {
  buildUser,
  buildBook,
  buildReq,
  buildRes,
  buildListItem,
  buildNext,
  notes,
} from 'utils/generate'
import * as booksDB from '../../db/books'
import * as listItemsDB from '../../db/list-items'
import * as listItemsController from '../list-items-controller'

jest.mock('../../db/books')
jest.mock('../../db/list-items')

beforeEach(() => {
  jest.clearAllMocks()
})

test('getListItem returns the req.listItem', async () => {
  // 🐨 create a user
  const user = buildUser()

  // 🐨 create a book
  const book = buildBook()
  // 🐨 create a listItem that has the user as the owner and the book
  const listItem = buildListItem({ownerId: user.id, bookId: book.id})

  // 🐨 mock booksDB.readById to resolve to the book
  booksDB.readById.mockResolvedValueOnce(book)

  // 🐨 make a request object that has properties for the user and listItem
  const req = buildReq({
    user,
    listItem,
  })

  // 💰 checkout the implementation of getListItem in ../list-items-controller
  // to see how the request object is used and what properties it needs.
  // 💰 and you can use buildReq from utils/generate
  // 🐨 make a response object
  // 💰 just use buildRes from utils/generate
  const res = buildRes()

  // 🐨 make a call to getListItem with the req and res (`await` the result)
  await listItemsController.getListItem(req, res)

  // 🐨 assert that booksDB.readById was called correctly
  expect(booksDB.readById).toHaveBeenCalledTimes(1)
  expect(booksDB.readById).toHaveBeenCalledWith(listItem.bookId)

  //🐨 assert that res.json was called correctly
  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toHaveBeenCalledWith({
    listItem: {
      ...listItem,
      book,
    },
  })
})

test('createListItem returns a 400 error if no bookId is provided', async () => {
  const req = buildReq()
  const res = buildRes()

  await listItemsController.createListItem(req, res)

  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.status).toBeCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "No bookId provided",
      },
    ]
  `)
  expect(res.status).toBeCalledTimes(1)
})

test('setListItem sets the listItem on the req', async () => {
  const user = buildUser()
  const listItem = buildListItem({
    ownerId: user.id,
  })
  listItemsDB.readById.mockResolvedValueOnce(listItem)
  const req = buildReq({user, params: {id: listItem.id}})
  const res = buildRes()
  const next = buildNext()

  await listItemsController.setListItem(req, res, next)
  expect(listItemsDB.readById).toBeCalledWith(listItem.id)
  expect(listItemsDB.readById).toBeCalledTimes(1)
  expect(next).toBeCalledWith(/* With nothing */)
  expect(next).toBeCalledTimes(1)
  expect(req.listItem).toBe(listItem)
})

test('setListItem returns 404 if the listItem does not exist', async () => {
  listItemsDB.readById.mockResolvedValueOnce(null)
  const id = 'fake_listitem_id'
  const req = buildReq({params: {id}})
  const res = buildRes()
  const next = buildNext()

  await listItemsController.setListItem(req, res, next)
  expect(listItemsDB.readById).toBeCalledWith(id)
  expect(listItemsDB.readById).toBeCalledTimes(1)
  expect(next).not.toBeCalled()

  expect(res.status).toBeCalledWith(404)
  expect(res.status).toBeCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "No list item was found with the id of fake_listitem_id",
      },
    ]
  `)
  expect(res.json).toBeCalledTimes(1)
})

test('setListItem returns 403 if the user is not the owner of listItem', async () => {
  const user = buildUser({
    id: 'FAKE_USER_ID',
  })
  const listItem = buildListItem({
    id: 'FAKE_LISTITEM_ITEM',
    ownerId: 'SOMEONE_ELSE',
  })
  listItemsDB.readById.mockResolvedValueOnce(listItem)
  const req = buildReq({user, params: {id: listItem.id}})
  const res = buildRes()
  const next = buildNext()

  await listItemsController.setListItem(req, res)
  expect(listItemsDB.readById).toBeCalledWith(listItem.id)
  expect(listItemsDB.readById).toBeCalledTimes(1)
  expect(next).not.toBeCalled()

  expect(res.status).toBeCalledWith(403)
  expect(res.status).toBeCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "User with id FAKE_USER_ID is not authorized to access the list item FAKE_LISTITEM_ITEM",
      },
    ]
  `)
  expect(res.json).toBeCalledTimes(1)
})

test(`getListItems returns a user's listItems`, async () => {
  const user = buildUser()
  const books = [buildBook(), buildBook()]
  const userListItems = [
    buildListItem({ownerId: user.id, bookId: books[0].id}),
    buildListItem({ownerId: user.id, bookId: books[1].id}),
  ]
  booksDB.readManyById.mockResolvedValueOnce(books)
  listItemsDB.query.mockResolvedValueOnce(userListItems)
  const req = buildReq({
    user,
  })
  const res = buildRes()

  await listItemsController.getListItems(req, res)
  expect(booksDB.readManyById).toHaveBeenCalledTimes(1)
  expect(booksDB.readManyById).toHaveBeenCalledWith([books[0].id, books[1].id])
  expect(listItemsDB.query).toHaveBeenCalledTimes(1)
  expect(listItemsDB.query).toHaveBeenCalledWith({ownerId: user.id})

  expect(res.json).toHaveBeenCalledTimes(1)
  expect(res.json).toBeCalledWith({
    listItems: [
      {...userListItems[0], book: books[0]},
      {...userListItems[1], book: books[1]},
    ],
  })
})

test('createListItem creates and returns a list item', async () => {
  const user = buildUser()
  const book = buildBook()
  const createdListItem = buildListItem({
    ownerId: user.id,
    bookId: book.id,
  })
  listItemsDB.query.mockResolvedValueOnce([])
  listItemsDB.create.mockResolvedValueOnce(createdListItem)
  booksDB.readById.mockResolvedValueOnce(book)
  const req = buildReq({
    user,
    body: {bookId: book.id},
  })
  const res = buildRes()

  await listItemsController.createListItem(req, res)

  expect(listItemsDB.query).toHaveBeenCalledWith({
    ownerId: user.id,
    bookId: book.id,
  })
  expect(listItemsDB.query).toBeCalledTimes(1)
  expect(listItemsDB.create).toHaveBeenCalledWith({
    ownerId: user.id,
    bookId: book.id,
  })
  expect(listItemsDB.create).toBeCalledTimes(1)
  expect(booksDB.readById).toHaveBeenCalledWith(book.id)
  expect(booksDB.readById).toBeCalledTimes(1)

  expect(res.json).toBeCalledWith({
    listItem: {
      ...createdListItem,
      book,
    },
  })
  expect(res.json).toBeCalledTimes(1)
})

test('createListItem returns a 400 error if the user already has a list item for the given book', async () => {
  const userId = 'existing_user_id'
  const bookId = 'existing_book_id'
  const user = buildUser({
    id: userId,
  })
  const book = buildBook({
    id: bookId,
  })
  const existingListItem = buildListItem({
    ownerId: user.id,
    bookId: book.id,
  })
  listItemsDB.query.mockResolvedValueOnce([existingListItem])
  const req = buildReq({
    user,
    body: {bookId: book.id},
  })
  const res = buildRes()

  await listItemsController.createListItem(req, res)

  expect(listItemsDB.query).toHaveBeenCalledWith({
    ownerId: user.id,
    bookId: book.id,
  })
  expect(listItemsDB.query).toBeCalledTimes(1)
  expect(res.status).toBeCalledWith(400)
  expect(res.status).toBeCalledTimes(1)
  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "message": "User existing_user_id already has a list item for the book with the ID existing_book_id",
      },
    ]
  `)
  expect(res.json).toBeCalledTimes(1)
})

test('updateListItem updates an existing list item', async () => {
  const user = buildUser()
  const book = buildBook()
  const listItem = buildListItem({
    ownerId: user.id,
    bookId: book.id,
  })
  const updates = {notes: notes()}
  const mergedListItemAndUpdates = {
    ...listItem,
    ...updates,
  }
  listItemsDB.update.mockResolvedValueOnce(mergedListItemAndUpdates)
  booksDB.readById.mockResolvedValueOnce(book)
  const req = buildReq({
    user,
    listItem,
    body: {...updates},
  })
  const res = buildRes()

  await listItemsController.updateListItem(req, res)

  expect(listItemsDB.update).toHaveBeenCalledWith(listItem.id, req.body)
  expect(listItemsDB.update).toBeCalledTimes(1)
  expect(booksDB.readById).toHaveBeenCalledWith(listItem.bookId)
  expect(booksDB.readById).toHaveBeenCalledTimes(1)
  expect(res.json).toBeCalledWith({
    listItem: {
      ...mergedListItemAndUpdates,
      book,
    },
  })
  expect(res.json).toBeCalledTimes(1)
})

test('deleteListItem deletes an existing list item', async () => {
  const user = buildUser()
  const listItem = buildListItem({
    ownerId: user.id,
  })
  const req = buildReq({user, listItem})
  const res = buildRes()

  await listItemsController.deleteListItem(req, res)

  expect(listItemsDB.remove).toHaveBeenCalledWith(listItem.id)
  expect(listItemsDB.remove).toBeCalledTimes(1)

  expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      Object {
        "success": true,
      },
    ]
  `)
  expect(res.json).toBeCalledTimes(1)
})
