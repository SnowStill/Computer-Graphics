//-----------CONSTANTS---------------//

const wall_distance = 30; //Distance of walls from the origin
const wall_size = 30; //Size of the walls (30 x 1 x 30)

const desk_scale = 16; //Adjust this to increase size of the desk
const ratio = 32;
const desk_dimensions = [desk_scale, desk_scale / ratio, desk_scale / 2];

//-----------END CONSTANTS-----------//

window.Final_Project_Scene = window.classes.Final_Project_Scene =
    class Final_Project_Scene extends Scene_Component {
        constructor(context, control_box)
        {
            // The scene begins by requesting the camera, shapes, and materials it will need.
            super(context, control_box);
            // First, include a secondary Scene that provides movement controls:
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 10, 20), Vec.of(0, 0, 0), Vec.of(0, 1, 0));
            this.initial_camera_location = Mat4.inverse(context.globals.graphics_state.camera_transform);

            const r = context.width / context.height;
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            const shapes = {
                //TODO - FILL IN OUR OWN SHAPES
                plane: new Cube(), //used for walls, floor, and ceiling
                desk: new Cube(),
                alarm_clock: new Cube(),
                alarm_dot: new Subdivision_Sphere(3),
                test_shape: new Torus(10, 10),

                Earth: new Subdivision_Sphere(4),
                racket: new Cube(),
                base: new Subdivision_Sphere(5)

            };

            this.submit_shapes(context, shapes);

            //Alarm clock variables
            this.clock_times = [0, 0, 0, 0, 0, 0];
            this.current_time = 0;
            this.adjust_mode = false;
            this.selected_number = 0;
            this.setRealTime();


            //Adjust colors of objects here
            const color_black = Color.of(0, 0, 0, 1);

            const desk_color = Color.of(0.72, 0.44, 0.13, 1);

            const floor_color = Color.of(0.41, 0.40, 0.11, 1);
            const wall_color = Color.of(0.62, 0.73, 0.83, 1);
            const ceiling_color = Color.of(1, 1, 1, 1);

            const alarm_clock_color = color_black;
            const alarm_screen_color = Color.of(0.44, 0, 0, 1);
            const alarm_number_color = Color.of(1, 0, 0, 1);
            const earth_color = Color.of(0, 0, 0, 1);
            //example material: context.get_instance(Phong_Shader).material(Color.of(0.067, 0.706, 0.38, 1), {diffusivity: 0.2, specularity: 1, ambient: 1})
            //We can adjust diffusivity, specularity, and ambience as such

            this.materials = {
                    //TODO - FILL IN OUR OWN MATERIALS
                    walls: context.get_instance(Phong_Shader).material(color_black, {ambient: 1, texture: context.get_instance("assets/wall.png", true)}),
                    floor: context.get_instance(Phong_Shader).material(color_black, {ambient: 1, texture: context.get_instance("assets/floor.jpg", true)}),
                    ceiling: context.get_instance(Phong_Shader).material(ceiling_color),

                    desk: context.get_instance(Phong_Shader).material(color_black, {ambient: 1, texture: context.get_instance("assets/desk.jpg", true)}),
                    
                    alarm_clock: context.get_instance(Phong_Shader).material(alarm_clock_color),
                    alarm_screen: context.get_instance(Phong_Shader).material(alarm_screen_color),
                    alarm_numbers: context.get_instance(Phong_Shader).material(alarm_number_color),
                    Earth: context.get_instance(Phong_Shader).material(earth_color, {ambient:1, texture: context.get_instance("c.jpg", true)}),
                    racket: context.get_instance(Phong_Shader).material(color_black, {ambient:1}),
                    base:context.get_instance(Phong_Shader).material(color_black, {ambient: 1, texture: context.get_instance("assets/floor.jpg", true)})
            };


            //TODO - FILL IN MORE LIGHTS AS NEEDED
            this.lights = [new Light(Vec.of(0, 10, 0, 1), Color.of(1, 1, 1, 1), 10000000),
                           new Light(Vec.of(-20, 0, 0, 1), Color.of(1, 1, 1, 1), 10000000),
                           new Light(Vec.of(0, -10, 0, 1), Color.of(1, 1, 1, 1), 10000000)]; //Creating the initial lights
        }

        make_control_panel() {
            //TODO - FILL IN MORE CONTROLS
            this.key_triggered_button("Default View", ["0"], () => this.attached = () => this.initial_camera_location);
            this.key_triggered_button("View Clock", ["1"], () => this.attached = () => this.alarm_clock);
            this.new_line();
            this.key_triggered_button("Adjust Clock", ["t"], () => this.adjust_mode = !this.adjust_mode);
            this.key_triggered_button("Select Clock Number", ["y"], () => this.selected_number = (this.selected_number + 1) % 6);
            this.key_triggered_button("Increase Selected Number", ["u"], this.adjustClock);
            this.new_line();
            this.key_triggered_button("Set Real Time", ["i"], this.setRealTime);
        }





        //setCamera attaches the camera to whichever object is picked, based on the make_control_panel function above
        setCamera(graphics_state) {
            if(this.attached !== undefined) {
                let camera_matrix = this.attached();

                if(camera_matrix !== undefined) {
                    let camera_transformation = Mat4.translation([0, 0, -5]);
                    camera_transformation = camera_transformation.times(Mat4.inverse(camera_matrix));

                    graphics_state.camera_transform = camera_transformation
                        .map((x, i) => Vec.from(graphics_state.camera_transform[i]).mix(x, .1));
                }
            }
        }














        drawDesk(graphics_state) {
            //TODO - ADD LEGS TO DESK

            let desk_model = Mat4.identity();
            let leg_model = Mat4.identity();
            desk_model = desk_model.times(Mat4.scale(desk_dimensions));

            this.shapes.desk.draw(graphics_state, desk_model, this.materials.desk);
            leg_model = Mat4.identity();
            leg_model = leg_model.times(Mat4.translation([-(desk_scale-2),-(10+desk_scale/ratio),-(desk_scale/2-2)]));
            leg_model = leg_model.times(Mat4.scale([2,10,2]));
            this.shapes.desk.draw(graphics_state, leg_model, this.materials.desk);
            leg_model = leg_model.times(Mat4.translation([desk_scale-2,0,0]));
            this.shapes.desk.draw(graphics_state, leg_model, this.materials.desk);
            leg_model = leg_model.times(Mat4.translation([0,0,desk_scale/2-2]));
            this.shapes.desk.draw(graphics_state, leg_model, this.materials.desk);
            leg_model = leg_model.times(Mat4.translation([-(desk_scale-2),0,0]));
            this.shapes.desk.draw(graphics_state, leg_model, this.materials.desk);

            let drawer_model = Mat4.identity();
            const drawer_dimensions = [desk_scale-4, 5*desk_scale / ratio, (desk_scale / 2-1)];
            drawer_model = drawer_model.times(Mat4.translation([0,-5*desk_scale/ratio, 0]));
            drawer_model = drawer_model.times(Mat4.scale(drawer_dimensions));
            this.shapes.desk.draw(graphics_state, drawer_model, this.materials.desk);
            return desk_model;
        }
        









        //Draws the alarm clock based on the size of the desk. Calls helper functions
        //To handle drawing the screen and numbers.
        drawAlarmClock(graphics_state, t) {
            this.updateClock(t);

            let alarm_clock_model = Mat4.identity();

            let x_move = desk_dimensions[0];
            let y_move = desk_dimensions[1];
            let z_move = desk_dimensions[2];

            let x_scale = 2;
            let y_scale = 0.5;
            let z_scale = 2;

            alarm_clock_model = alarm_clock_model.times(Mat4.translation([-x_move + 2 * x_scale, y_move * 2, -z_move + 2 * z_scale]));
            alarm_clock_model = alarm_clock_model.times(Mat4.rotation(Math.PI / 4, Vec.of(0, 1, 0)));
            alarm_clock_model = alarm_clock_model.times(Mat4.scale([x_scale, y_scale, z_scale]));

            this.shapes.alarm_clock.draw(graphics_state, alarm_clock_model, this.materials.alarm_clock);

            this.drawAlarmClockScreen(graphics_state, alarm_clock_model, x_scale, y_scale, z_scale, t);

            //unscaling before returning so that camera matrix can view it properly when attached
            alarm_clock_model = alarm_clock_model.times(Mat4.scale([1/x_scale, 1/y_scale, 1/z_scale]));

            return alarm_clock_model;
        }

        drawAlarmClockScreen(graphics_state, alarm_clock_model, x_scale, y_scale, z_scale, t) {
            let alarm_screen_model = alarm_clock_model.times(Mat4.translation([0, 0, z_scale / 2])); //Moving screen to front of clock
            alarm_screen_model = alarm_screen_model.times(Mat4.scale([0.85, 0.85, 0.01])); //Scaling it to be thin and fit inside front of clock

            this.shapes.alarm_clock.draw(graphics_state, alarm_screen_model, this.materials.alarm_screen);

            this.drawAlarmClockNumbers(graphics_state, alarm_screen_model, x_scale, y_scale, z_scale, t);
        }

        //This function takes the Alarm Clock Screen model and draws the screens information from it
        //The model starts at the center of the front of the alarm clock
        drawAlarmClockNumbers(graphics_state, screen_model, x_scale, y_scale, z_scale, t) {
            let alarm_number_model = screen_model;

            //The amount the whole numbers move
            let x_position_far = x_scale / 2.5;
            let x_position_mid = x_scale / 4;
            let x_position_near = x_scale / 16;

            //The amount the individual segments move
            let y_move = y_scale/2 + 0.5;
            let x_move = x_scale / 20;

            //The amount the dots are moved
            let x_dot_position = (x_position_mid + x_position_near) / 2;
            let y_dot_position = y_move / 2;

                //Scaling required for individual segments
            let horizontal = [x_scale / 20, y_scale / 20, 1];
            let vertical = [x_scale / 200, y_scale / 2, 1];

            //number_positions translates the whole numbers, while translations and scales transform individual segments
            let number_positions = [[-x_position_far, 0, 0], [-x_position_mid, 0, 0], [-x_position_near, 0, 0],
                [x_position_near, 0, 0], [x_position_mid, 0, 0], [x_position_far, 0, 0]];
            let dot_positions = [[-x_dot_position, y_dot_position, 0], [-x_dot_position, -y_dot_position, 0],
                [x_dot_position, y_dot_position, 0], [x_dot_position, -y_dot_position, 0]];
            let translations = [[0, y_move, 0], [x_move, y_move / 2, 0], [x_move, -y_move / 2, 0], [0, -y_move, 0],
                [-x_move, -y_move/2, 0], [-x_move, y_move / 2, 0], [0, 0, 0]];
            let scales = [horizontal, vertical, vertical, horizontal, vertical, vertical, horizontal];

            alarm_number_model = alarm_number_model.times(Mat4.translation([0, 0, 2])); //Moving it in front of screen

            for(let i = 0; i < 6; ++i) { //Loop through each individual number
                let segment_pattern = this.getSevenSegmentDisplay(this.clock_times[i]);
                let current_number_model = alarm_number_model.times(Mat4.translation(number_positions[i])); //Get segment pattern for number

                //Checking that either it's not in adjust mode, or if it is, checking the number
                //selected is not equal to this one. If those conditions fail, draw for 2/3 of a second
                if(!this.adjust_mode || this.selected_number !== i || (t - Math.floor(t) >= 0.333)) {
                    for (let j = 0; j < 7; ++j) { //Loop through each segment of the number and draw depending on pattern
                        let seg_model = current_number_model;
                        seg_model = seg_model.times(Mat4.translation(translations[j]));
                        seg_model = seg_model.times(Mat4.scale(scales[j]));

                        if (segment_pattern[j] === "1") {
                            this.shapes.alarm_clock.draw(graphics_state, seg_model, this.materials.alarm_numbers);
                        }
                    }
                }
            }

            for(let i = 0; i < 4; ++i) {
                let dot_model = alarm_number_model;
                dot_model = dot_model.times(Mat4.translation(dot_positions[i]));
                dot_model = dot_model.times(Mat4.scale([x_scale / 200, y_scale / 20, 1]));

                this.shapes.alarm_dot.draw(graphics_state, dot_model, this.materials.alarm_numbers);
            }
        }

        getSevenSegmentDisplay(number) {
            switch(number) {
                case 0:
                    return "1111110";
                case 1:
                    return "0110000";
                case 2:
                    return "1101101";
                case 3:
                    return "1111001";
                case 4:
                    return "0110011";
                case 5:
                    return "1011011";
                case 6:
                    return "1011111";
                case 7:
                    return "1110000";
                case 8:
                    return "1111111";
                case 9:
                    return "1110011";
            }
        }

        updateClock(t) { //Adds 1 to the current timer if not in adjust mode
            if(!this.adjust_mode) {
                if (Math.floor(t) > this.current_time) {
                    this.current_time = Math.floor(t);
                    this.clock_times[5] = (this.clock_times[5] + 1) % 10;

                    if (this.clock_times[5] === 0) {
                        this.clock_times[4] = (this.clock_times[4] + 1) % 6;

                        if (this.clock_times[4] === 0) {
                            this.clock_times[3] = (this.clock_times[3] + 1) % 10;

                            if (this.clock_times[3] === 0) {
                                this.clock_times[2] = (this.clock_times[2] + 1) % 6;

                                if (this.clock_times[2] === 0) {

                                    if (this.clock_times[0] === 0) { //Special checking for hours place
                                        this.clock_times[1] = (this.clock_times[1] + 1) % 10;

                                        if (this.clock_times[1] === 0) {
                                            this.clock_times[0] = 1;
                                        }
                                    }
                                    else {
                                        this.clock_times[1] = (this.clock_times[1] + 1) % 3;

                                        if (this.clock_times[1] === 0) {
                                            this.clock_times[1] = 1;
                                            this.clock_times[0] = 0;
                                        }

                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        //When in adjust mode, the user can adjust the individual faces of the clock
        //Modulo_number is the maximum number that a particular number can be
        //Eg. The leftmost hour digit can only be 0 or 1, the leftmost minutes can be 0-9
        adjustClock() {
            if(this.adjust_mode) {
                let modulo_number;
                switch (this.selected_number) {
                    case 0:
                        if(this.clock_times[1] <= 2) {
                            modulo_number = 2;
                        }
                        else {
                            modulo_number = 1;
                        }
                        break;
                    case 1:
                        if (this.clock_times[0] == 0) { //Checking if hours are 10-12 or 0-9
                            modulo_number = 10;
                        } else {
                            modulo_number = 3;
                        }
                        break;
                    case 3:
                    case 5:
                        modulo_number = 10;
                        break;
                    default:
                        modulo_number = 6;
                }

                this.clock_times[this.selected_number] = (this.clock_times[this.selected_number] + 1) % modulo_number;
            }
        }

        setRealTime() {
            let today = new Date();
            let hours = today.getHours() % 12;
            let minutes = today.getMinutes();
            let seconds = today.getSeconds();

            //getting individual digits of the time
            let time_digits = [Math.floor(hours / 10), hours % 10, Math.floor(minutes / 10), minutes % 10, Math.floor(seconds / 10), seconds % 10];
            for(let i = 0; i < 6; ++i) {
                this.clock_times[i] = time_digits[i];
            }
        }


















        drawWalls(graphics_state) {
            const rotation_angle = Math.PI / 2;

            let left_wall, right_wall, front_wall, back_wall;
            let walls = [left_wall, right_wall, front_wall, back_wall];

            let translations = [[-wall_distance, 0, 0], [wall_distance, 0, 0], [0, 0, wall_distance], [0, 0, -wall_distance]];
            let rotations = [Vec.of(0, 0, 1), Vec.of(0, 0, 1), Vec.of(1, 0, 0), Vec.of(1, 0, 0)];

            //Loop through the walls. Scale, rotate, and then translate according to which wall it is (order is left, right, front, back)
            for(let i = 0; i < 4; ++i) {
                walls[i] = Mat4.identity();
                walls[i] = walls[i].times(Mat4.translation(translations[i]));
                walls[i] = walls[i].times(Mat4.rotation(rotation_angle, rotations[i]));
                walls[i] = walls[i].times(Mat4.scale([wall_size, 1, wall_size]));

                this.shapes.plane.draw(graphics_state, walls[i], this.materials.walls);
            }
        }

        drawFloorAndCeiling(graphics_state) {
            let ceiling_model, floor_model;
            let models = [ceiling_model, floor_model];
            let distances = [wall_distance, -wall_distance];
            let materials = [this.materials.ceiling, this.materials.floor];

            //Loop through the models (ceiling first, then floor). Scale, and then move the plane before drawing
            for(let i = 0; i < 2; ++i) {
                models[i] = Mat4.identity();
                models[i] = models[i].times(Mat4.translation([0, distances[i], 0]));
                models[i] = models[i].times(Mat4.scale([wall_size, 1, wall_size]));
                this.shapes.plane.draw(graphics_state, models[i], materials[i]);
            }
        }

        drawRoom(graphics_state) {
            this.drawWalls(graphics_state);
            this.drawFloorAndCeiling(graphics_state);
        }

        drawEarth(t, graphics_state){
            let x_move = desk_dimensions[0];
            let y_move = desk_dimensions[1];
            let z_move = desk_dimensions[2];

            let x_scale = 2;
            let z_scale = 2;
            let earth_model = Mat4.identity();
            earth_model = earth_model.times(Mat4.translation([-x_move + 12 * x_scale, y_move * 2+ 4, -z_move + 2 * z_scale]));
            earth_model = earth_model.times(Mat4.rotation(2*t,Vec.of(1,1,0)));
            earth_model = earth_model.times(Mat4.scale([3,3,3]));
            this.shapes.Earth.draw(graphics_state,earth_model,this.materials.Earth);
           
               
        }

        drawracket(t,graphics_state){
           let x_move = desk_dimensions[0];
           let y_move = desk_dimensions[1];
           let z_move = desk_dimensions[2];
           let x_scale = 2;
           let z_scale = 2;
           let racket_model = Mat4.identity();
           let base_model = Mat4.identity();

           racket_model = racket_model.times(Mat4.translation([-x_move + 12 * x_scale, y_move * 2, -z_move + 2 * z_scale]));
           racket_model = racket_model.times(Mat4.scale([0.1,0.6,0.1]));
           base_model = base_model.times(Mat4.translation([-x_move + 12 * x_scale, y_move * 1, -z_move + 2 * z_scale]));
           base_model = base_model.times(Mat4.scale([1.5,0.4,1.5]));
           this.shapes.racket.draw(graphics_state, racket_model, this.materials.racket);
           this.shapes.base.draw(graphics_state, base_model, this.materials.base);
           racket_model = Mat4.identity();
       
           racket_model = racket_model.times(Mat4.translation([-x_move + 12 * x_scale, y_move * 2+4, -z_move + 2* z_scale]));
           racket_model = racket_model.times(Mat4.rotation(Math.PI/4, Vec.of(0,0,-1)));
           racket_model = racket_model.times(Mat4.scale([0.1,3.5,0.1]));
           this.shapes.racket.draw(graphics_state, racket_model, this.materials.racket);

          //to do: the hemisphere racket

        }









        display(graphics_state) {
            const t = graphics_state.animation_time / 1000;
            graphics_state.lights = this.lights; //Adding the new light to the graphics state


            this.drawRoom(graphics_state);

            this.desk = this.drawDesk(graphics_state);
            this.alarm_clock = this.drawAlarmClock(graphics_state, t);
            this.drawEarth(t, graphics_state);
            this.drawracket(t,graphics_state);
            //this.testFunction(graphics_state);

            this.setCamera(graphics_state);
        }

        //this is a function you can call from display while experimenting and trying new shapes
        //It keeps display from getting too cluttered with code that is temporary
        testFunction(graphics_state) {
            //Moving to corner of desk
            let test_model = Mat4.identity().times(Mat4.translation([desk_dimensions[0] / 2 - 1, desk_dimensions[1], -desk_dimensions[2] / 2 + 1]));
            test_model = test_model.times(Mat4.rotation(Math.PI/2, Vec.of(1, 0, 0)));

            this.shapes.test_shape.draw(graphics_state, test_model, this.materials.alarm_clock);
        }
    };

        