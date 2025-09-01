import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Cookmenu from '../views/childrenpage/CookMenu.vue'
import AlBum from '../views/childrenpage/AlBum.vue'
import MemoRandum from '../views/childrenpage/MemoRandum.vue'
import MusicForm from '../views/childrenpage/MusicForm.vue';
import PetPhotos from '../views/childrenpage/PetPhotos.vue';
import MessageBoard from '../views/childrenpage/MessageBoard.vue';
import FaceRecognition from '../views/childrenpage/hahaha.vue';


Vue.use(VueRouter)

const routes = [{
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/album',
    name: 'album',
    component: AlBum,
  },
  {
    path: '/petphotos',
    name: 'petphotos',
    component: PetPhotos,
  },
  {
    path: '/cookmenu',
    name: 'cookmenu',
    component: Cookmenu,
  },
  {
    path: '/memorandum',
    name: 'memorandum',
    component: MemoRandum,
  },
  {
    path: '/messageboard',
    name: 'messageboard',
    component: MessageBoard,
  },
  {
    path: '/music',
    name: 'music',
    component: MusicForm,
  },
  {
    path: '/face',
    name: 'face',
    component: FaceRecognition,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router