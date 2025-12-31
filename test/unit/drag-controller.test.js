/**
 * Drag Controller Unit Tests
 */

import { DragController } from '../../js/dragController.js';

describe('DragController', () => {
    let element;
    let dragController;

    beforeEach(() => {
        element = document.createElement('div');
        element.style.width = '300px';
        element.style.height = '300px';
        document.body.appendChild(element);

        // Mock getBoundingClientRect
        element.getBoundingClientRect = jest.fn(() => ({
            left: 0,
            top: 0,
            width: 300,
            height: 300
        }));

        dragController = new DragController(element);
    });

    afterEach(() => {
        dragController.destroy();
        document.body.removeChild(element);
    });

    describe('angleToMinutes()', () => {
        test('should convert 0 radians to 1 minute', () => {
            expect(DragController.angleToMinutes(0)).toBe(1);
        });

        test('should convert PI/2 (90 degrees) to approximately 15 minutes', () => {
            const minutes = DragController.angleToMinutes(Math.PI / 2);
            expect(minutes).toBeGreaterThanOrEqual(14);
            expect(minutes).toBeLessThanOrEqual(16);
        });

        test('should convert PI (180 degrees) to approximately 30 minutes', () => {
            const minutes = DragController.angleToMinutes(Math.PI);
            expect(minutes).toBeGreaterThanOrEqual(29);
            expect(minutes).toBeLessThanOrEqual(31);
        });

        test('should convert 2*PI (360 degrees) to 60 minutes', () => {
            // At 2*PI, due to modulo it wraps to 0, so it should be 1
            // Testing near 2*PI
            const minutes = DragController.angleToMinutes(2 * Math.PI - 0.01);
            expect(minutes).toBe(60);
        });

        test('should handle negative angles', () => {
            const minutes = DragController.angleToMinutes(-Math.PI);
            expect(minutes).toBeGreaterThanOrEqual(29);
            expect(minutes).toBeLessThanOrEqual(31);
        });

        test('should clamp to min/max range', () => {
            expect(DragController.angleToMinutes(0)).toBeGreaterThanOrEqual(1);
            expect(DragController.angleToMinutes(10 * Math.PI)).toBeLessThanOrEqual(60);
        });
    });

    describe('minutesToAngle()', () => {
        test('should convert 1 minute to 0 radians', () => {
            expect(DragController.minutesToAngle(1)).toBe(0);
        });

        test('should convert 60 minutes to 2*PI radians', () => {
            expect(DragController.minutesToAngle(60)).toBeCloseTo(2 * Math.PI);
        });

        test('should convert 30 minutes to approximately PI radians', () => {
            const angle = DragController.minutesToAngle(30);
            expect(angle).toBeCloseTo(Math.PI, 1);
        });
    });

    describe('enable/disable', () => {
        test('should be enabled by default', () => {
            expect(dragController.isEnabled).toBe(true);
        });

        test('should disable drag interaction', () => {
            dragController.disable();
            expect(dragController.isEnabled).toBe(false);
        });

        test('should enable drag interaction', () => {
            dragController.disable();
            dragController.enable();
            expect(dragController.isEnabled).toBe(true);
        });
    });

    describe('drag events', () => {
        test('should call onDragStart when mouse down', () => {
            const mockOnDragStart = jest.fn();
            dragController.onDragStart = mockOnDragStart;

            const event = new MouseEvent('mousedown', {
                clientX: 150,
                clientY: 0
            });
            element.dispatchEvent(event);

            expect(mockOnDragStart).toHaveBeenCalled();
        });

        test('should call onDrag when mouse moves during drag', () => {
            const mockOnDrag = jest.fn();
            dragController.onDrag = mockOnDrag;

            const mouseDown = new MouseEvent('mousedown', {
                clientX: 150,
                clientY: 0
            });
            element.dispatchEvent(mouseDown);

            const mouseMove = new MouseEvent('mousemove', {
                clientX: 300,
                clientY: 150
            });
            document.dispatchEvent(mouseMove);

            expect(mockOnDrag).toHaveBeenCalled();
        });

        test('should call onDragEnd when mouse up', () => {
            const mockOnDragEnd = jest.fn();
            dragController.onDragEnd = mockOnDragEnd;

            const mouseDown = new MouseEvent('mousedown', {
                clientX: 150,
                clientY: 0
            });
            element.dispatchEvent(mouseDown);

            const mouseUp = new MouseEvent('mouseup');
            document.dispatchEvent(mouseUp);

            expect(mockOnDragEnd).toHaveBeenCalled();
        });

        test('should not trigger drag when disabled', () => {
            const mockOnDragStart = jest.fn();
            dragController.onDragStart = mockOnDragStart;
            dragController.disable();

            const event = new MouseEvent('mousedown', {
                clientX: 150,
                clientY: 0
            });
            element.dispatchEvent(event);

            expect(mockOnDragStart).not.toHaveBeenCalled();
        });

        test('should add dragging class during drag', () => {
            const mouseDown = new MouseEvent('mousedown', {
                clientX: 150,
                clientY: 0
            });
            element.dispatchEvent(mouseDown);

            expect(element.classList.contains('dragging')).toBe(true);
        });

        test('should remove dragging class after drag ends', () => {
            const mouseDown = new MouseEvent('mousedown', {
                clientX: 150,
                clientY: 0
            });
            element.dispatchEvent(mouseDown);

            const mouseUp = new MouseEvent('mouseup');
            document.dispatchEvent(mouseUp);

            expect(element.classList.contains('dragging')).toBe(false);
        });
    });

    describe('touch events', () => {
        test('should handle touch start', () => {
            const mockOnDragStart = jest.fn();
            dragController.onDragStart = mockOnDragStart;

            const touchEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 150, clientY: 0 }]
            });
            element.dispatchEvent(touchEvent);

            expect(mockOnDragStart).toHaveBeenCalled();
        });
    });

    describe('angle calculation', () => {
        test('should calculate angle from center', () => {
            const mockOnDrag = jest.fn();
            dragController.onDrag = mockOnDrag;

            // Top center should be near 0
            const mouseDown = new MouseEvent('mousedown', {
                clientX: 150,
                clientY: 0 // Top of circle
            });
            element.dispatchEvent(mouseDown);

            expect(mockOnDrag).toHaveBeenCalled();
            const result = mockOnDrag.mock.calls[0][0];
            expect(result.angle).toBeCloseTo(0, 1);
        });
    });
});
