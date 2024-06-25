<script setup lang="ts"></script>

<template>
  <div id="temu-loader text-center">
    <div style="z-index: 1060; position: fixed; top: 0; width: 100%">
      <div class="loading text-center">
        <div class="load-circle1"></div>
        <div class="load-circle2"></div>
        <div class="load-circle3"></div>
        <div class="load-circle4"></div>
        <div class="load-circle5"></div>
      </div>
    </div>
    <div class="preloader">
      <div class="preloader-inner">
        <div class="loadingText"><span>Printing... Don't unplug printer.</span></div>
        <slot name="action"></slot>
      </div>
    </div>
  </div>
</template>
<style scoped>
.preloader {
  position: fixed;
  top: 63px;
  left: 0;
  z-index: 999999;
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: hidden;
  opacity: 1;
}

.preloader .preloader-inner {
  position: absolute;
  top: calc(50% - 63px);
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}
.preloader .preloader-inner .preloader-icon {
  width: 72px;
  height: 72px;
  display: inline-block;
  padding: 0px;
}
.preloader .preloader-inner .preloader-icon span {
  position: absolute;
  display: inline-block;
  width: 72px;
  height: 72px;
  border-radius: 100%;
  background: #ff2f2a;
  -webkit-animation: preloader-fx 1.6s linear infinite;
  animation: preloader-fx 1.6s linear infinite;
}
.preloader .preloader-inner .preloader-icon span:last-child {
  animation-delay: -0.8s;
  -webkit-animation-delay: -0.8s;
}
.loading {
  margin-top: 20px;
}
.load-circle1,
.load-circle2,
.load-circle3,
.load-circle4,
.load-circle5 {
  width: 8px;
  height: 8px;
  background: grey;
  display: inline-block;
  border-radius: 20px;
  -webkit-animation: loader 1.5s infinite;
  animation: loader 1.5s infinite;
}
.load-circle2 {
  -webkit-animation-delay: 0.25s;
  animation-delay: 0.25s;
}
.load-circle3 {
  -webkit-animation-delay: 0.5s;
  animation-delay: 0.5s;
}
.load-circle4 {
  -webkit-animation-delay: 0.75s;
  animation-delay: 0.75s;
}
.load-circle5 {
  -webkit-animation-delay: 1s;
  animation-delay: 1s;
}
.loadingText {
  display: block;
  font-weight: 300;
  text-align: center;
  font-size: 18px;
  line-height: 10px;
}
.loadingText span {
  position: relative;
  margin: auto;
  color: #33333390;
}
.loadingText span:after {
  content: "Printing... Don't unplug printer";
  position: absolute;
  overflow: hidden;
  max-width: 100%;
  white-space: nowrap;
  color: #00123e;
  left: 0;
  animation: loading 1.5s linear infinite;
}
@-webkit-keyframes loader {
  from {
    opacity: 1;
    scale: 1;
  }
  to {
    opacity: 0.25;
    scale: 0.3;
  }
}
@keyframes loader {
  from {
    opacity: 1;
    scale: 1;
  }
  to {
    opacity: 0.25;
    scale: 0.3;
  }
}
@media (min-width: 1200px) {
  .preloader {
    left: 200px;
    top: 63px;
  }
  .preloader .preloader-inner {
    top: calc(50% - 63px);
    left: calc(50% - 200px);
  }
}
@keyframes preloader-fx {
  0% {
    -webkit-transform: scale(0, 0);
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    -webkit-transform: scale(1, 1);
    transform: scale(1, 1);
    opacity: 0;
  }
}
@-webkit-keyframes preloader-fx {
  0% {
    -webkit-transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    -webkit-transform: scale(1, 1);
    opacity: 0;
  }
}
@keyframes loading {
  0% {
    max-width: 5%;
  }
  /* 20% {color: red}
    60% {color: #06a90e}
    100% {color: #06a90e} */
}
</style>