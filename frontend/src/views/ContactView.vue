<template>
  <v-container class="about">
    <v-sheet class="px-6 pt-6 pb-0 mx-auto" max-width="1200" rounded>
      <h3 class="mt-2 mb-2">Contact Information</h3>
      <p class="mt-0 mb-0">
        This project is a collaboration between the
        <a href="https://globalresilience.northeastern.edu/"
          >Global Resilience Institute at Northeastern University</a
        >
        and <a href="https://www.cuahsi.org/">CUAHSI</a>. If you have any questions or would like to
        get in touch, please visit the
        <a
          href="https://globalresilience.northeastern.edu/project/cooperative-institute-for-research-to-operations-in-hydrology-ciroh/"
        >
          project's website </a
        >, contact one of our team members directly via email, or post an issue on
        <a href="https://github.com/CUAHSI/com_res">the project's GitHub page</a>. Our team is
        always happy to connect!
      </p>
    </v-sheet>

    <v-sheet class="px-6 pt-2 pb-6 mx-auto" max-width="1200" rounded>
      <h3 class="mt-0 mb-2">Our Team</h3>
      <v-row align="center" justify="center">
        <v-col
          v-for="member in members"
          :key="member.name"
          cols="12"
          sm="6"
          md="4"
          class="d-flex justify-center"
        >
          <v-card>
            <v-img
              :src="`${member.image}`"
              :width="400"
              aspect-ratio="1"
              cover
              :lazy-src="`${member.image}`"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
                </div>
              </template>
            </v-img>
            <v-card-title class="text-h6">
              {{ member.name }}
            </v-card-title>
            <v-card-subtitle>
              {{ member.position }}
              <v-divider></v-divider>
              {{ member.org }}
              <v-divider></v-divider>
              {{ member.email }}
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </v-container>
</template>

<script setup>
import kristinImg from '@/assets/KristinRaub.jpg'
import steveImg from '@/assets/SteveFlynn.jpg'
import robinImg from '@/assets/RobinWhite.webp'
import danielaImg from '@/assets/DanielaRinconReyes.jpg'
import allisonImg from '@/assets/AllisonDeese.jpg'
import emmaImg from '@/assets/EmmaHibbert.jpg'
import naliniImg from '@/assets/NaliniGunawardena.jpeg'
const members = [
  {
    name: 'Dr. Anthony Castronova',
    image: 'https://www.cuahsi.org/uploads/team/img/_headshot/TCastronova.jpg',
    position: 'Senior Research Hydrologist & Co-Principal Investigator',
    org: 'CUAHSI',
    email: 'acastronova@cuahsi.org'
  },
  {
    name: 'Devin Cowan',
    image: 'https://www.cuahsi.org/uploads/team/img/_headshot/Devin-Cowan.jpg',
    position: 'Research Programmer',
    org: 'CUAHSI',
    email: 'dcowan@cuahsi.org'
  },
  {
    name: 'Dr. Irene Garousi-Nejad',
    image: 'https://www.cuahsi.org/uploads/team/img/_headshot/Irene_headshot03.jpg',
    position: 'Research Scientist',
    org: 'CUAHSI',
    email: 'igarousi@cuahsi.org'
  },
  {
    name: 'Dr. Kristin Raub',
    image: kristinImg,
    position: 'Sr. Research Scientist & Principal Investigator',
    org: 'Global Resilience Institute',
    email: 'k.raub@northeastern.edu'
  },
  {
    name: 'Dr. Stephen Flynn',
    image: steveImg,
    position: 'Founding Director & Co-Principal Investigator',
    org: 'Global Resilience Institute',
    email: 's.flynn@northeastern.edu'
  },
  {
    name: 'Dr. Robin White',
    image: robinImg,
    position: 'Distinguished Senior Fellow',
    org: 'Global Resilience Institute',
    email: 'r.white@northeastern.edu'
  },
  {
    name: 'Daniela Rincon Reyes',
    image: danielaImg,
    position: 'Senior Research Associate',
    org: 'Global Resilience Institute',
    email: 'd.rinconreyes@northeastern.edu'
  },
  {
    name: 'Allison Deese',
    image: allisonImg,
    position: 'Pre-Doctoral Fellow',
    org: 'Global Resilience Institute',
    email: 'donine.a@northeastern.edu'
  },
  {
    name: 'Emma Hibbert',
    image: emmaImg,
    position: 'Senior Research Associate',
    org: 'Global Resilience Institute',
    email: 'e.hibbert@northeastern.edu'
  },
  {
    name: 'Nalini Gunawardena',
    image: naliniImg,
    position: 'Undergraduate Research Assistant',
    org: 'Global Resilience Institute',
    email: 'n.gunawardena@northeastern.edu'
  }
]
</script>
