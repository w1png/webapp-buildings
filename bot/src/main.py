import os
from re import S
import typing
import io

from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

import requests
import asyncio
from aiogram import Bot, Dispatcher, filters, types

token = os.getenv("TELEGRAM_TOKEN")

if not token:
    raise ValueError("TELEGRAM_TOKEN env variable is not set")

class EqualsFilter(filters.Filter):
    def __init__(self, my_text: str) -> None:
        self.my_text = my_text

    async def __call__(self, update: types.Message | types.CallbackQuery) -> bool:
        text = ""

        match type(update):
            case types.Message:
                text = typing.cast(types.Message, update).text
            case types.CallbackQuery:
                text = typing.cast(types.CallbackQuery, update).data

        if not text:
            return False

        return text == self.my_text


class StartsWithFilter(filters.Filter):
    def __init__(self, my_text: str) -> None:
        self.my_text = my_text

    async def __call__(self, update: types.Message | types.CallbackQuery) -> bool:
        text = ""

        match type(update):
            case types.Message:
                text = typing.cast(types.Message, update).text
            case types.CallbackQuery:
                text = typing.cast(types.CallbackQuery, update).data

        if not text:
            return False

        return text.startswith(self.my_text)


bot = Bot(token=token)
dp = Dispatcher()

class Adress:
    def __init__(self, id: int, name: str) -> None:
        self.id = id
        self.name = name

class Region:
    def __init__(self, id: int, name: str, adresses: typing.List[Adress]) -> None:
        self.id = id
        self.name = name
        self.adresses = adresses

async def region_callback(callback: types.CallbackQuery) -> None:
    resp = requests.get(f"http://localhost:3000/api/json/regions/{callback.data.split('_')[1]}")
    if resp.status_code != 200:
        return

    data = resp.json()
    if not data:
        return

    adresses = []

    for adress in data["Adresses"]:
        adresses.append(Adress(id=adress["ID"], name=adress["Name"]))

    buttons = [
        [
            types.InlineKeyboardButton(text=adress.name, callback_data=f"adress_{adress.id}"),
        ] for adress in adresses
    ]
    buttons.append([types.InlineKeyboardButton(text="Назад", callback_data="start")])
    markup = types.InlineKeyboardMarkup(inline_keyboard=buttons)

    text = f"Округ: {data['Name']}\nВыберите адрес:"

    try:
        await bot.edit_message_text(text=text, chat_id=callback.message.chat.id, message_id=callback.message.message_id, reply_markup=markup)
    except:
        await bot.send_message(callback.message.chat.id, text, reply_markup=markup)


async def start_callback(callback: types.CallbackQuery) -> None:
    await bot.delete_message(callback.message.chat.id, callback.message.message_id)
    await start_handler(callback.message)

class AdressImagesState(StatesGroup):
    message_id = State()

    adress_id = State()
    images = State()

async def adress_callback(callback: types.CallbackQuery, state: FSMContext) -> None:
    id = int(callback.data.split("_")[1])
    await state.set_state(AdressImagesState.images)
    await state.update_data(adress_id=id)

    markup = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(text="Отмена", callback_data="cancel_adress_images"),
            ]
        ]
    )

    try:
        await bot.edit_message_text(text="Отправьте фотографии", chat_id=callback.message.chat.id, message_id=callback.message.message_id, reply_markup=markup)
    except:
        await callback.message.answer("Отправьте фотографии", reply_markup=markup)

async def adress_images_upload(message: types.Message, state: FSMContext) -> None:
    # if message has Photos
    if not message.photo:
        return

    data = await state.get_data()
    if "message_id" in data:
        message_id = data["message_id"]

        try:
            await bot.delete_message(message.chat.id, message_id)
        except:
            pass

    if "images" not in data:
        data["images"] = []
    images = data["images"]

    images.append(message.photo[-1].file_id)


    markup = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(text="Отмена", callback_data="cancel_adress_images"),
                types.InlineKeyboardButton(text="Отправить", callback_data="send_adress_images"),
            ]
        ]
    )

    await bot.delete_message(message.chat.id, message.message_id)

    new_message_id = await bot.send_message(message.chat.id, f"Загружено {len(images)} фотографий", reply_markup=markup)

    await state.update_data(images=images, message_id=new_message_id.message_id)
    data = await state.get_data()

async def adress_images_cancel(callback: types.CallbackQuery, state: FSMContext) -> None:
    data = await state.get_data()
    if "message_id" in data:
        message_id = data["message_id"]

        try:
            await bot.delete_message(callback.message.chat.id, message_id)
        except:
            pass

    await state.clear()
    await bot.send_message(callback.message.chat.id, "Отменено")
    await state.clear()
    await start_handler(callback.message)

async def adress_images_send(callback: types.CallbackQuery, state: FSMContext) -> None:
    # download all the images to binaryio and upload them as multipart form to POST http://localhost:3000/api/images
    data = await state.get_data()
    if "images" not in data:
        return

    images = data["images"]
    adress_id = data["adress_id"]

    batches_sent = 0

    # split images into batches of 25 per
    image_batches = []

    for i in range(0, len(images), 25):
        image_batches.append(images[i:i+25])

    async def send_batch(batch: typing.List[str], i: int) -> None:
        print(f"sending number {i} batch of {len(batch)} images")
        files = []

        for image in batch:
            image_bytes = io.BytesIO()
            await bot.download(file=image, destination=image_bytes)

            files.append(("images", (f"image_{len(files)}", image_bytes, "image/jpeg")))

        resp = requests.post(f"http://localhost:3000/api/adress/{adress_id}/images", files=files)
        if resp.status_code != 200:
            return

        print(f"sent batch number {i}")

    tasks = []

    for i, batch in enumerate(image_batches):
        tasks.append(send_batch(batch, i))
        batches_sent += 1

    await asyncio.gather(*tasks)

    resp = requests.get(f"http://localhost:3000/api/json/adresses/{adress_id}")
    if resp.status_code != 200:
        return

    data = resp.json()
    if not data:
        return

    adress_name = data["Name"]

    resp = requests.get(f"http://localhost:3000/api/json/regions/{data['RegionId']}")
    if resp.status_code != 200:
        return

    data = resp.json()
    if not data:
        return

    region_name = data["Name"]



    await bot.send_message(callback.message.chat.id, f"Фотографии загружены в адрес {adress_name} в регионе {region_name}")
    await bot.delete_message(callback.message.chat.id, callback.message.message_id)
    await state.clear()
    await start_handler(callback.message)



async def start_handler(message: types.Message) -> None:
    # http localhost:3000/api/json/admin_telegram_ids
    # returns list of ids that are int

    resp = requests.get("http://localhost:3000/api/json/admin_telegram_ids")
    if resp.status_code != 200:
        return

    data = resp.json()
    if not data:
        return

    if message.chat.id in typing.cast(typing.List[int], data):
        # web_app = types.WebAppInfo(url="https://building-telegram.w1png.ru")
        web_app = types.WebAppInfo(url="https://telegram.w1png.ru")
        await bot.set_chat_menu_button(message.chat.id, menu_button=types.MenuButtonWebApp(text="Админ панель", web_app=web_app))
    else:
        await bot.set_chat_menu_button(message.chat.id, menu_button=types.MenuButtonDefault())

    resp = requests.get("http://localhost:3000/api/json/regions")
    if resp.status_code != 200:
        return

    data = resp.json()
    if not data:
        return

    regions = []

    for region in data:
        adresses = []
        for adress in region["Adresses"]:
            adresses.append(Adress(id=adress["ID"], name=adress["Name"]))

        regions.append(Region(id=region["ID"], name=region["Name"], adresses=adresses))

    markup = types.InlineKeyboardMarkup(inline_keyboard=[
        [
            types.InlineKeyboardButton(text=region.name, callback_data=f"region_{region.id}"),
        ] for region in regions
    ])
    

    await bot.send_message(message.chat.id, "Выберите округ:", reply_markup=markup)

async def main() -> None:
    await bot.delete_webhook()

    dp.message.register(start_handler, filters.CommandStart())
    dp.callback_query.register(region_callback, StartsWithFilter("region_"))
    dp.callback_query.register(start_callback, EqualsFilter("start"))

    dp.callback_query.register(adress_callback, StartsWithFilter("adress_"))
    dp.message.register(adress_images_upload, AdressImagesState.images)
    dp.callback_query.register(adress_images_cancel, AdressImagesState.images, EqualsFilter("cancel_adress_images"))
    dp.callback_query.register(adress_images_send, AdressImagesState.images, EqualsFilter("send_adress_images"))

    await dp.start_polling(bot, handle_as_tasks=False)

if __name__ == "__main__":
    asyncio.run(main())
